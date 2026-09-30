import { Injectable, Logger } from '@nestjs/common';
import { Prisma, type CheckoutRequest } from '../generated/prisma/client';
import { PrismaService } from '../database/prisma.service';
import { CatalogClientService } from '../clients/catalog-client.service';
import { CartClientService } from '../clients/cart-client.service';
import { UpstreamError } from '../clients/internal-http.client';
import { WorkflowLeaseService } from '../workflow/workflow-lease.service';
import { AttentionError, BudgetReached, LeaseLost, failureCode, needsAttention, nextRetry, prismaCode, transaction } from '../workflow/workflow.util';
import { addressSchema, cartSnapshotSchema, itemsSchema, type ReservationView } from './checkout-contracts';

type Intent = CheckoutRequest;
type Owned = { key: string, owner: string };

@Injectable()
export class CheckoutRunnerService {
  private readonly logger = new Logger(CheckoutRunnerService.name);
  constructor(
    private readonly db: PrismaService,
    private readonly catalogClient: CatalogClientService,
    private readonly cartClient: CartClientService,
    private readonly lease: WorkflowLeaseService,
  ) {}
 // Run a checkout workflow for a given checkout request, ensuring that only one instance of the workflow can run at a time for a given checkout request.
  private atomic<T>(lock: Owned, fn: (tx: Prisma.TransactionClient) => Promise<T>) {
    return transaction(this.db, async tx => {
      await this.lease.assertOwned(tx, lock.key, lock.owner);
      return fn(tx);
    });
  }

  private async failed(c: Intent, lock: Owned, code: string) {
    await this.atomic(lock, async tx => {
      const order = await tx.order.findUnique({ where: { checkoutRequestId: c.id } });
      if (order && order.status !== 'PENDING_CONFIRMATION') {
        throw new AttentionError('ORDER_ALREADY_FINALIZED');
      }
      if(order) {
        await tx.order.update({ where: { id: order.id }, data: { status: 'CANCELLED'}});
        await tx.orderStatusHistory.create({ data: {
          orderId: order.id,
          fromStatus: 'PENDING_CONFIRMATION',
          toStatus: 'CANCELLED',
          reason: code,
        }});
      }
      await tx.checkoutRequest.update({ 
        where: { id: c.id }, 
        data: { 
          status: 'FAILED',
          failureCode: code,
          cleanupStatus: 'PENDING',
         }
      })
    })
  }
  private async writeOrder(c: Intent, reservation: ReservationView, lock: Owned) {
    const address = addressSchema.parse(c.addressSnapshot);
    const items = itemsSchema.parse(c.productSnapshot);
    const total = items.reduce((sum, item) => sum + item.lineTotal, 0);
    if (items.some(i => i.lineTotal !== i.unitPrice * i.quantity) ||
        total !== c.subtotal || c.totalAmount !== total) {
      throw new AttentionError('SNAPSHOT_TOTAL_MISMATCH');
    }
    await this.atomic(lock, async tx => {
      let order = await tx.order.findUnique({ where: { checkoutRequestId: c.id } });
      if (!order) order = await tx.order.create({ data: {
        userId: c.userId, checkoutRequestId: c.id,
        reservationId: reservation.reservationId, paymentMethod: 'COD',
        subtotal: c.subtotal, shippingFee: 0, discountAmount: 0,
        totalAmount: c.totalAmount, status: 'PENDING_CONFIRMATION',
        items: { create: items }, address: { create: address },
        history: { create: { toStatus: 'PENDING_CONFIRMATION', actorId: c.userId } },
      } });
      if (order.reservationId !== reservation.reservationId) {
        throw new AttentionError('ORDER_RESERVATION_MISMATCH');
      }
      await tx.checkoutRequest.update({ where: { id: c.id }, data: {
        status: 'ORDER_WRITTEN', reservationId: reservation.reservationId,
      } });
    });
  }

  private async compensateIfNoOrder(c: Intent, lock: Owned) {
    await this.atomic(lock, async tx => {
      const order = await tx.order.findUnique({ where: { checkoutRequestId: c.id } });
      await tx.checkoutRequest.update({ where: { id: c.id }, data: order
        ? { status: 'ORDER_WRITTEN', reservationId: order.reservationId }
        : { status: 'COMPENSATION_PENDING' },
      });
    });
  }

  private async complete(c: Intent, lock: Owned) {
    await this.atomic(lock, async tx => {
      const order = await tx.order.findUnique({ where: { checkoutRequestId: c.id } });
      if (!order) throw new AttentionError('ORDER_MISSING');
      if (order.status === 'PENDING_CONFIRMATION') {
        await tx.order.update({ where: { id: order.id }, data: {
          status: 'PLACED', placedAt: new Date(),
        } });
        await tx.orderStatusHistory.create({ data: {
          orderId: order.id, fromStatus: 'PENDING_CONFIRMATION',
          toStatus: 'PLACED', reason: 'RESERVATION_CONFIRMED',
        } });
      } else if (!order.placedAt) {
        throw new AttentionError('ORDER_FINAL_STATE_MISMATCH');
      }
      await tx.checkoutRequest.update({ where: { id: c.id }, data: {
        status: 'COMPLETED', lastErrorCode: null, needsAttention: false,
        nextAttemptAt: new Date(),
      } });
    });
  }

  private async defer(id: string, lock: Owned, error: unknown) {
    await this.atomic(lock, async tx => {
      const row = await tx.checkoutRequest.findUniqueOrThrow({ where: { id } });
      const attempts = row.attempts + (error instanceof BudgetReached ? 0 : 1);
      await tx.checkoutRequest.update({ where: { id }, data: {
        attempts, lastErrorCode: failureCode(error),
        nextAttemptAt: nextRetry(attempts),
        needsAttention: needsAttention(error) || attempts >= 20,
      } });
    });
  }

  async run(id: string, requestId?: string, budgetMs = 20_000): Promise<void> {
    const key = 'checkout:' + id;
    const owner = await this.lease.acquire(key);
    if (!owner) return;
    const lock = { key, owner };
    const deadline = Date.now() + budgetMs;
    const io = async <T>(operation: () => Promise<T>) => {
      await this.lease.renew(key, owner);
      if (Date.now() + 5_500 > deadline) throw new BudgetReached();
      return operation();
    };
    try {
      for (let step = 0; step < 8; step++) {
        const c = await this.db.checkoutRequest.findUniqueOrThrow({ where: { id } });
        if (c.status === 'FAILED' || c.needsAttention) return;
        const cart = cartSnapshotSchema.parse(c.cartSnapshot);
        const items = itemsSchema.parse(c.productSnapshot);
        const lines = items.map(i => ({ productId: i.productId, quantity: i.quantity }));

        if (c.status === 'COMPLETED') {
          if (c.cleanupStatus !== 'PENDING') return;
          const order = await this.db.order.findUniqueOrThrow({ where: { checkoutRequestId: id } });
          const cleaned = await io(() => this.cartClient.cleanup(c.userId, order.id, cart, requestId));
          await this.atomic(lock, tx => tx.checkoutRequest.update({ where: { id }, data: {
            cleanupStatus: cleaned.skippedProductIds.length ? 'SKIPPED' : 'DONE',
            lastErrorCode: null,
          } }));
          return;
        }

        let reservation = await io(() =>
          this.catalogClient.findReservationByKey(c.reservationKey, requestId));
        if (reservation) {
          const canonical = (rows: Array<{ productId: string; quantity: number }>) =>
            JSON.stringify([...rows].sort((a, b) =>
              a.productId < b.productId ? -1 : a.productId > b.productId ? 1 : 0));
          if (canonical(reservation.lines) !== canonical(lines) ||
              new Date(reservation.expiresAt).getTime() !== c.reservationExpiresAt.getTime()) {
            throw new AttentionError('RESERVATION_SNAPSHOT_MISMATCH');
          }
        }

        if (c.status === 'COMPENSATION_PENDING') {
          const order = await this.db.order.findUnique({ where: { checkoutRequestId: id } });
          if (order) throw new AttentionError('COMPENSATION_HAS_ORDER');
          if (reservation?.status === 'CONFIRMED') {
            throw new AttentionError('COMPENSATION_ALREADY_CONFIRMED');
          }
          if (reservation?.status === 'PENDING') {
            try {
              reservation = await io(() => this.catalogClient.release(reservation!.reservationId, requestId));
            } catch (error) {
              if (!(error instanceof UpstreamError) || error.upstreamStatus !== 409) throw error;
              reservation = await io(() => this.catalogClient.findReservationByKey(c.reservationKey, requestId));
              if (!reservation || !['RELEASED', 'EXPIRED'].includes(reservation.status)) throw error;
            }
          }
          if (reservation && !['RELEASED', 'EXPIRED'].includes(reservation.status)) {
            throw new AttentionError('COMPENSATION_NOT_RELEASED');
          }
          await this.failed(c, lock, 'ORDER_WRITE_FAILED');
          return;
        }

        if (c.status === 'PROCESSING') {
          if (!reservation) {
            if (c.reservationExpiresAt.getTime() <= Date.now()) {
              await this.failed(c, lock, 'RESERVATION_EXPIRED'); return;
            }
            try {
              reservation = await io(() => this.catalogClient.reserve(
                lines, c.reservationKey, c.reservationExpiresAt.toISOString(), requestId));
            } catch (error) {
              if (error instanceof UpstreamError && error.code === 'INSUFFICIENT_STOCK') {
                await this.failed(c, lock, 'INSUFFICIENT_STOCK'); return;
              }
              // Expiry có thể vừa qua giữa GET và POST reserve.
              if (error instanceof UpstreamError && error.upstreamStatus === 400 &&
                  c.reservationExpiresAt.getTime() <= Date.now()) continue;
              throw error;
            }
          }
          if (['RELEASED', 'EXPIRED'].includes(reservation.status)) {
            await this.failed(c, lock, 'RESERVATION_EXPIRED'); return;
          }
          if (reservation.status === 'PENDING' &&
              new Date(reservation.expiresAt).getTime() <= Date.now()) {
            await this.compensateIfNoOrder(c, lock); continue;
          }
          if (reservation.status === 'CONFIRMED') {
            this.logger.warn({ checkoutRequestId: id, requestId, code: 'RECOVER_CONFIRMED_INTENT' });
          }
          try { await this.writeOrder(c, reservation, lock); }
          catch (error) {
            if (prismaCode(error, 'P2002')) {
              const existing = await this.db.order.findUnique({ where: { checkoutRequestId: id } });
              if (!existing) throw error;
              await this.compensateIfNoOrder(c, lock);
            } else if (['P2000', 'P2003', 'P2011', 'P2012'].some(code => prismaCode(error, code)) &&
                       reservation.status === 'PENDING') {
              await this.compensateIfNoOrder(c, lock);
            } else {
              // Lỗi DB không xác định: để retry, KHÔNG release ngay.
              throw error;
            }
          }
          continue;
        }

        // ORDER_WRITTEN
        const order = await this.db.order.findUnique({ where: { checkoutRequestId: id } });
        if (!order || !reservation || order.reservationId !== reservation.reservationId) {
          throw new AttentionError('ORDER_RESERVATION_MISSING');
        }
        if (reservation.status === 'PENDING') {
          try {
            reservation = await io(() => this.catalogClient.confirm(order.reservationId, requestId));
          } catch (error) {
            if (!(error instanceof UpstreamError) || error.upstreamStatus !== 409) throw error;
            reservation = await io(() => this.catalogClient.findReservationByKey(c.reservationKey, requestId));
            if (!reservation || reservation.status === 'PENDING') throw error;
          }
        }
        if (reservation.status === 'CONFIRMED') {
          await this.complete(c, lock); continue;
        }
        await this.failed(c, lock, 'RESERVATION_EXPIRED');
        return;
      }
    } catch (error) {
      if (!(error instanceof LeaseLost)) {
        this.logger.warn({ requestId, checkoutRequestId: id, code: failureCode(error) });
        try { await this.defer(id, lock, error); }
        catch { this.logger.error({ checkoutRequestId: id, code: 'RETRY_RECORD_UNAVAILABLE' }); }
      }
    } finally {
      try { await this.lease.release(key, owner); }
      catch { this.logger.warn({ checkoutRequestId: id, code: 'LEASE_RELEASE_UNAVAILABLE' }); }
    }
  }

}