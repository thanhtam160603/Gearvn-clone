import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CatalogClientService } from '../clients/catalog-client.service';
import { UpstreamError } from '../clients/internal-http.client';
import { WorkflowLeaseService } from '../workflow/workflow-lease.service';
import {
  AttentionError, LeaseLost, failureCode, needsAttention, nextRetry, transaction,
} from '../workflow/workflow.util';
import { orderInclude, toOrderView, type OrderView } from './order-view';

@Injectable()
export class OrderCancellationService {
    private readonly logger = new Logger(OrderCancellationService.name);
    constructor(
        private readonly prisma: PrismaService,
        private readonly catalogClient: CatalogClientService,
        private readonly workflowLease: WorkflowLeaseService,
    ) {} 

    async cancel(userId: string, orderId: string, requestId: string): Promise<OrderView | null> 
    {
        await transaction(this.prisma, async (tx) => {
            const row = await tx.order.findFirst({
                where: { id: orderId, userId, placedAt: { not: null } },
            });
            if (!row) throw new NotFoundException();
            if (row.status === 'CANCELLED' || row.status === 'CANCELLATION_PENDING') return;
            if (row.status !== 'PLACED') throw new ConflictException({
                code: 'ORDER_STATE_CONFLICT', message: 'Đơn hàng không thể hủy',
            });
            const changed = await tx.order.updateMany({
                where: { id: orderId, userId, status: 'PLACED' },
                data: {
                    status: 'CANCELLATION_PENDING',
                    cancellationRetryAt: new Date(),
                },
            });
            if (changed.count !== 1) throw new ConflictException('Order đã thay đổi');
            await tx.orderStatusHistory.create({
                data: {
                    orderId: orderId,
                    fromStatus: 'PLACED',
                    toStatus: 'CANCELLATION_PENDING',
                    actorId: userId,
                    reason: 'CUSTOMER_CANCEL',
                }
            })
        })
        await this.run(orderId, requestId);
        const row = await this.prisma.order.findFirstOrThrow({
            where: { id: orderId, userId },
            include: orderInclude,
        });
        return toOrderView(row);
    }
    async run(id: string, requestId?: string): Promise<void> {
        const key = 'cancel:' + id;
        const owner = await this.workflowLease.acquire(key);
        if (!owner) return;
        try {
        const order = await this.prisma.order.findUniqueOrThrow({ where: { id } });
        if (order.status !== 'CANCELLATION_PENDING' || order.cancellationNeedsAttention) return;
        await this.workflowLease.renew(key, owner);
        const result = await this.catalogClient.returnStock(id, order.reservationId, requestId);
        if (result.orderId !== id || result.reservationId !== order.reservationId) {
            throw new AttentionError('STOCK_RETURN_RESPONSE_MISMATCH');
        }
        await transaction(this.prisma, async tx => {
            await this.workflowLease.assertOwned(tx, key, owner);
            const changed = await tx.order.updateMany({
            where: { id, status: 'CANCELLATION_PENDING' },
            data: {
                status: 'CANCELLED', cancelledAt: new Date(),
                cancellationErrorCode: null, cancellationRetryAt: null,
                cancellationNeedsAttention: false,
            },
            });
            if (changed.count === 1) await tx.orderStatusHistory.create({ data: {
            orderId: id, fromStatus: 'CANCELLATION_PENDING', toStatus: 'CANCELLED',
            reason: 'STOCK_RETURNED',
            } });
        });
        } catch (error) {
        if (!(error instanceof LeaseLost)) {
            this.logger.warn({ requestId, orderId: id, code: failureCode(error) });
            try {
            await transaction(this.prisma, async tx => {
                await this.workflowLease.assertOwned(tx, key, owner);
                const row = await tx.order.findUniqueOrThrow({ where: { id } });
                if (row.status !== 'CANCELLATION_PENDING') return;
                const attempts = row.cancellationAttempts + 1;
                await tx.order.update({ where: { id }, data: {
                cancellationAttempts: attempts, cancellationErrorCode: failureCode(error),
                cancellationRetryAt: nextRetry(attempts),
                cancellationNeedsAttention: attempts >= 20 || needsAttention(error) ||
                    (error instanceof UpstreamError && error.upstreamStatus === 409),
                } });
            });
            } catch { this.logger.error({ orderId: id, code: 'CANCEL_RETRY_RECORD_UNAVAILABLE' }); }
        }
        } finally {
        try { await this.workflowLease.release(key, owner); }
        catch { this.logger.warn({ orderId: id, code: 'LEASE_RELEASE_UNAVAILABLE' }); }
        }
    }
}
