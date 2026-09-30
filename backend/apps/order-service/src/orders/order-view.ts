import { Prisma } from '../generated/prisma/client';
export const orderInclude = {
  items: { orderBy: { id: 'asc' } },
  address: true,
  history: { orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] },
} satisfies Prisma.OrderInclude;
export type OrderRow = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;
export function toOrderView(row: OrderRow) {
  return {
    id: row.id, status: row.status, paymentMethod: row.paymentMethod,
    subtotal: row.subtotal, shippingFee: row.shippingFee,
    discountAmount: row.discountAmount, totalAmount: row.totalAmount,
    items: row.items.map(i => ({
      id: i.id, productId: i.productId, sku: i.sku, productName: i.productName,
      image: i.image, unitPrice: i.unitPrice, quantity: i.quantity, lineTotal: i.lineTotal,
    })),
    address: row.address ? {
      recipientName: row.address.recipientName, phone: row.address.phone,
      addressLine: row.address.addressLine, ward: row.address.ward,
      district: row.address.district, city: row.address.city, note: row.address.note,
    } : null,
    history: row.history.map(h => ({
      fromStatus: h.fromStatus, toStatus: h.toStatus,
      reason: h.reason, createdAt: h.createdAt.toISOString(),
    })),
    placedAt: row.placedAt?.toISOString() ?? null,
    shippedAt: row.shippedAt?.toISOString() ?? null,
    deliveredAt: row.deliveredAt?.toISOString() ?? null,
    cancelledAt: row.cancelledAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString(),
  };
}
export type OrderView = ReturnType<typeof toOrderView>;