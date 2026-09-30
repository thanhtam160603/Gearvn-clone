import { randomUUID } from 'node:crypto';
import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { Prisma, type CheckoutRequest } from '../generated/prisma/client';
import { PrismaService } from '../database/prisma.service';
import { CartClientService } from '../clients/cart-client.service';
import { CatalogClientService } from '../clients/catalog-client.service';
import { UpstreamError } from '../clients/internal-http.client';
import { cartSnapshotSchema } from './checkout-contracts';
import { CheckoutDto } from './dto/checkout.dto';
import { checkoutInput } from './checkout-hash';
import { CheckoutRunnerService } from './checkout-runner.service';
import type { CheckoutResult } from './checkout.types';
import { orderInclude, toOrderView } from '../orders/order-view';

@Injectable()
export class CheckoutService {
  constructor(
    private readonly db: PrismaService,
    private readonly carts: CartClientService,
    private readonly catalog: CatalogClientService,
    private readonly runner: CheckoutRunnerService,
  ) {}

  private async result(row: CheckoutRequest, hash: string): Promise<CheckoutResult> {
    if (row.bodyHash !== hash) throw new ConflictException({
      code: 'IDEMPOTENCY_CONFLICT', message: 'Key đã dùng với nội dung khác',
    });
    if (row.status === 'FAILED') throw new ConflictException({
      code: 'CHECKOUT_FAILED', message: 'Checkout không thành công; dùng key mới để thử lại',
      details: [{ checkoutRequestId: row.id, failureCode: row.failureCode }],
    });
    if (row.status === 'COMPLETED') {
      const order = await this.db.order.findUniqueOrThrow({
        where: { checkoutRequestId: row.id }, include: orderInclude,
      });
      return { kind: 'completed', order: toOrderView(order) };
    }
    return { kind: 'pending', checkoutRequestId: row.id };
  }

  async checkout(userId: string, key: string | undefined, dto: CheckoutDto,
    requestId?: string): Promise<CheckoutResult> {
    if (typeof key !== 'string' || !/^[A-Za-z0-9._:-]{1,128}$/.test(key)) {
      throw new BadRequestException('Thiếu/sai Idempotency-Key');
    }
    const { address, hash } = checkoutInput(dto);
    const prior = await this.db.checkoutRequest.findUnique({
      where: { userId_key: { userId, key } },
    });
    if (prior) return this.result(prior, hash);

    const rawCart = await this.carts.getSelectedSnapshot(userId, requestId);
    if (!rawCart.cartId || !rawCart.lines.length) throw new ConflictException({
      code: 'EMPTY_SELECTION', message: 'Chưa chọn sản phẩm để mua',
    });
    const cart = cartSnapshotSchema.parse(rawCart);
    const lookup = await this.catalog.resolveProducts(cart.lines.map(l => l.productId), requestId);
    const byId = new Map(lookup.items.map(p => [p.id, p]));
    if (byId.size !== lookup.items.length) throw new UpstreamError(502, 'DEPENDENCY_CONTRACT');
    const items = cart.lines.map(line => {
      const product = byId.get(line.productId);
      if (!product || product.status !== 'in-stock' || product.available < line.quantity) {
        throw new ConflictException({ code: 'PRODUCT_UNAVAILABLE', message: 'Sản phẩm không đủ hàng' });
      }
      return {
        productId: product.id, sku: product.sku, productName: product.name,
        image: product.image, unitPrice: product.salePrice, quantity: line.quantity,
        lineTotal: product.salePrice * line.quantity,
      };
    });
    const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
    if (!Number.isSafeInteger(subtotal) || subtotal < 0 || subtotal > 2_147_483_647) {
      throw new ConflictException({
        code: 'ORDER_AMOUNT_OUT_OF_RANGE', message: 'Tổng tiền vượt giới hạn',
      });
    }

    const id = randomUUID();
    let intent: CheckoutRequest;
    try {
      intent = await this.db.checkoutRequest.create({ data: {
        id, userId, key, bodyHash: hash,
        cartId: cart.cartId, cartVersion: cart.cartVersion,
        cartSnapshot: cart, productSnapshot: items, addressSnapshot: address,
        paymentMethod: 'COD', subtotal, shippingFee: 0, discountAmount: 0,
        totalAmount: subtotal, reservationKey: 'checkout:' + id,
        reservationExpiresAt: new Date(Date.now() + 10 * 60_000),
      } });
    } catch (error: unknown) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') {
        throw error;
      }
      const winner = await this.db.checkoutRequest.findUnique({
        where: { userId_key: { userId, key } },
      });
      if (winner) return this.result(winner, hash);
      const active = await this.db.checkoutRequest.findFirst({
        where: {
          userId, cartId: cart.cartId, cartVersion: cart.cartVersion,
          status: { not: 'FAILED' },
        },
      });
      if (!active) throw error;
      throw new ConflictException({
        code: 'CART_CHECKOUT_EXISTS', message: 'Phiên bản giỏ này đã được checkout',
        details: [{ checkoutRequestId: active.id }],
      });
    }
    await this.runner.run(intent.id, requestId);
    intent = await this.db.checkoutRequest.findUniqueOrThrow({ where: { id: intent.id } });
    return this.result(intent, hash);
  }
}