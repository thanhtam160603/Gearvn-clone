import {
  ConflictException, Injectable, NotFoundException,
} from "@nestjs/common";
import { Prisma } from "../generated/prisma/client";
import { PrismaService } from "../database/prisma.service";
import { CatalogClientService } from "./catalog-client.service";
import { CartViewService, cartInclude } from "./cart-view.service";
import type { CartOwner } from "./cart-owner.types";

@Injectable()
export class CartService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly catalog: CatalogClientService,
        private readonly view: CartViewService,
    ) {}

    private key(owner: CartOwner) {
        return { ownerType_ownerId: { ownerType: owner.type, ownerId: owner.id } };
    }

    private async retry<T>(operation: () => Promise<T>): Promise<T> {
        for (let attempt = 0; attempt < 3; attempt++) {
        try { return await operation(); }
        catch (error: unknown) {
            const retryable = error instanceof Prisma.PrismaClientKnownRequestError &&
            (error.code === "P2034" || error.code === "P2002");
            if (!retryable || attempt === 2) throw error;
        }
        }
        throw new Error("Cart transaction retry exhausted");
    }

    private async findOrCreate(owner: CartOwner) {
        return this.prisma.cart.upsert({
        where: this.key(owner),
        create: { ownerType: owner.type, ownerId: owner.id },
        update: {}, include: cartInclude,
        });
    }

    async get(owner: CartOwner, requestId?: string) {
        return this.view.toView(await this.findOrCreate(owner), requestId);
    }

    async add(owner: CartOwner, productId: string, added: number, requestId?: string) {
        const lookup = await this.catalog.resolve([productId], requestId);
        const product = lookup.items[0];
        if (!product) throw new NotFoundException("Sản phẩm không tồn tại");
        if (product.available < added) throw new ConflictException("Không đủ tồn kho");
        return this.retry(() => this.prisma.$transaction(async (tx) => {
        const cart = await tx.cart.upsert({
            where: this.key(owner), create: { ownerType: owner.type, ownerId: owner.id },
            update: {},
        });
        const existing = await tx.cartItem.findUnique({
            where: { cartId_productId: { cartId: cart.id, productId } },
        });
        if (!existing && await tx.cartItem.count({ where: { cartId: cart.id } }) >= 100) {
            throw new ConflictException("Giỏ hàng tối đa 100 sản phẩm");
        }
        const quantity = (existing?.quantity ?? 0) + added;
        if (quantity > 99 || quantity > product.available) {
            throw new ConflictException("Số lượng vượt tồn kho/giới hạn Cart");
        }
        await tx.cartItem.upsert({
            where: { cartId_productId: { cartId: cart.id, productId } },
            create: { cartId: cart.id, productId, quantity, selected: true },
            update: { quantity }, // giữ selected hiện có
        });
        const updated = await tx.cart.update({
            where: { id: cart.id }, data: { version: { increment: 1 } },
        });
        return { cartId: updated.id, version: updated.version };
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }));
    }

    async setQuantity(owner: CartOwner, productId: string, quantity: number,
        requestId?: string) {
        const lookup = await this.catalog.resolve([productId], requestId);
        const product = lookup.items[0];
        if (!product) throw new NotFoundException("Sản phẩm không tồn tại");
        if (quantity > product.available) throw new ConflictException("Không đủ tồn kho");
        return this.retry(() => this.prisma.$transaction(async (tx) => {
        const cart = await tx.cart.findUnique({ where: this.key(owner) });
        if (!cart) throw new NotFoundException("Cart item không tồn tại");
        const changed = await tx.cartItem.updateMany({
            where: { cartId: cart.id, productId }, data: { quantity },
        });
        if (changed.count !== 1) throw new NotFoundException("Cart item không tồn tại");
        const updated = await tx.cart.update({
            where: { id: cart.id }, data: { version: { increment: 1 } },
        });
        return { cartId: updated.id, version: updated.version };
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }));
    }

    async select(owner: CartOwner, productId: string, selected: boolean) {
        return this.retry(() => this.prisma.$transaction(async (tx) => {
        const cart = await tx.cart.findUnique({ where: this.key(owner) });
        if (!cart) throw new NotFoundException("Cart item không tồn tại");
        const changed = await tx.cartItem.updateMany({
            where: { cartId: cart.id, productId }, data: { selected },
        });
        if (changed.count !== 1) throw new NotFoundException("Cart item không tồn tại");
        const updated = await tx.cart.update({
            where: { id: cart.id }, data: { version: { increment: 1 } },
        });
        return { cartId: updated.id, version: updated.version };
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }));
    }

    async remove(owner: CartOwner, productId: string) {
        return this.retry(() => this.prisma.$transaction(async (tx) => {
        const cart = await tx.cart.findUnique({ where: this.key(owner) });
        if (!cart) throw new NotFoundException("Cart item không tồn tại");
        const changed = await tx.cartItem.deleteMany({
            where: { cartId: cart.id, productId },
        });
        if (changed.count !== 1) throw new NotFoundException("Cart item không tồn tại");
        const updated = await tx.cart.update({
            where: { id: cart.id }, data: { version: { increment: 1 } },
        });
        return { cartId: updated.id, version: updated.version };
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }));
    }

    async clear(owner: CartOwner) {
        return this.retry(() => this.prisma.$transaction(async (tx) => {
        const cart = await tx.cart.upsert({
            where: this.key(owner), create: { ownerType: owner.type, ownerId: owner.id },
            update: {},
        });
        const deleted = await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
        if (deleted.count === 0) return { cartId: cart.id, version: cart.version };
        const updated = await tx.cart.update({
            where: { id: cart.id }, data: { version: { increment: 1 } },
        });
        return { cartId: updated.id, version: updated.version };
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }));
    }
}
