import { Prisma } from '../generated/prisma/client';
export const warrantyInclude = {
  orderItem: true,
  history: { orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] },
} satisfies Prisma.WarrantyRequestInclude;
type WarrantyRow = Prisma.WarrantyRequestGetPayload<{ include: typeof warrantyInclude }>;
export function toWarrantyView(row: WarrantyRow) {
    const i = row.orderItem;
    return {
        id: row.id, orderItemId: row.orderItemId, orderId: i.orderId,
        status: row.status, reason: row.reason, description: row.description,
        item: {
        productId: i.productId, sku: i.sku, productName: i.productName,
        image: i.image, quantity: i.quantity, unitPrice: i.unitPrice,
        },
        history: row.history.map(h => ({
        fromStatus: h.fromStatus, toStatus: h.toStatus,
        note: h.note, createdAt: h.createdAt.toISOString(),
        })),
        createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString(),
    };
}