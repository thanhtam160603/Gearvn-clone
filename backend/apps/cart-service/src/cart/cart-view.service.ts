import { Injectable } from "@nestjs/common";
import { Prisma } from "../generated/prisma/client";
import { CatalogClientService } from "./catalog-client.service";

export const cartInclude = {
    items: { orderBy: { createdAt: "asc" } },
} satisfies Prisma.CartInclude;
export type CartRow = Prisma.CartGetPayload<{ include: typeof cartInclude }>;

@Injectable()
export class CartViewService {
    constructor(
        private readonly catalog: CatalogClientService
    ) {}
    async toView(cart: CartRow, requestId?: string) {
    const data = await this.catalog.resolve(cart.items.map((i) => i.productId), requestId);
    const byId = new Map(data.items.map((p) => [p.id, p]));
    const items = cart.items.map((item) => {
    const product = byId.get(item.productId);
    const lineTotal = product ? product.salePrice * item.quantity : 0;
    return {
        productId: item.productId, 
        quantity: item.quantity,
        selected: item.selected, 
        name: product?.name ?? null,
        slug: product?.slug ?? null, 
        image: product?.image ?? null,
        salePrice: product?.salePrice ?? null,
        available: product?.available ?? 0, 
        status: product?.status ?? "missing",
        canCheckout: !!product && product.available >= item.quantity,
        lineTotal,
    };
    });
    return {
        cartId: cart.id, version: cart.version, items,
        subtotal: items.reduce((sum, item) => sum + item.lineTotal, 0),
        selectedSubtotal: items.reduce((sum, item) =>
            sum + (item.selected ? item.lineTotal : 0), 0),
    };
}
}