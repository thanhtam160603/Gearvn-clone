import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../database/prisma.service';
import { CartCheckoutCleanupDto } from './dto/cart-checkout.dto';

@Injectable()
export class CartCheckoutService {
    constructor(private readonly prisma: PrismaService) {}

    snapshot(userId: string) {
        return this.prisma.$transaction(async (tx) => {
            const cart = await tx.cart.findUnique({
                where: { ownerType_ownerId: { ownerType: 'USER', ownerId: userId } },
                include: { items: { where: { selected: true }, orderBy: { productId: 'asc' } } },
            });
            return {
                cartId: cart?.id ?? null,
                cartVersion: cart?.version ?? 0,
                lines: cart?.items.map(i => ({
                cartItemId: i.id, productId: i.productId,
                quantity: i.quantity, itemVersion: i.version,
                })) ?? [],
            };
        }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
    }

    cleanup(dto: CartCheckoutCleanupDto) {
        return this.prisma.$transaction(async (tx) => {
        const cart = await tx.cart.findFirst({
            where: { id: dto.cartId, ownerType: 'USER', ownerId: dto.userId },
        });
        const removedProductIds: string[] = [];
        const skippedProductIds: string[] = [];
        for (const line of dto.lines) {
            const count = cart ? (await tx.cartItem.deleteMany({
            where: {
                id: line.cartItemId, cartId: cart.id, productId: line.productId,
                quantity: line.quantity, version: line.itemVersion, selected: true,
            },
            })).count : 0;
            (count === 1 ? removedProductIds : skippedProductIds).push(line.productId);
        }
        if (cart && removedProductIds.length) {
            await tx.cart.update({
            where: { id: cart.id }, data: { version: { increment: 1 } },
            });
        }
        return { removedProductIds, skippedProductIds };
        });
    }
}