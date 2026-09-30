import { z } from 'zod';
const id = z.string().min(1).max(128);
const amount = z.number().int().min(0).max(2_147_483_647);
const lineSchema = z.object({
    cartItemId: id, productId: id,
    quantity: z.number().int().min(1).max(99),
    itemVersion: z.number().int().nonnegative(),
});
const lines = z.array(lineSchema).max(100).refine(rows =>
    new Set(rows.map(r => r.cartItemId)).size === rows.length &&
    new Set(rows.map(r => r.productId)).size === rows.length);
export const cartResponseSchema = z.object({
    cartId: id.nullable(), cartVersion: z.number().int().nonnegative(), lines,
});
export const cartSnapshotSchema = cartResponseSchema.extend({
    cartId: id, lines: lines.refine(rows => rows.length > 0),
});
export const addressSchema = z.object({
    recipientName: z.string().min(1), phone: z.string().min(1),
    addressLine: z.string().min(1), ward: z.string().min(1),
    district: z.string().min(1), city: z.string().min(1),
    note: z.string().nullable(),
});
export const itemSchema = z.object({
    productId: id, sku: z.string().min(1), productName: z.string().min(1),
    image: z.string().nullable(), unitPrice: amount,
    quantity: z.number().int().min(1).max(99), lineTotal: amount,
});
export const itemsSchema = z.array(itemSchema).min(1).max(100);
export const productResolveSchema = z.object({
    items: z.array(z.object({
    id, sku: z.string().min(1), slug: z.string(), name: z.string(),
    image: z.string().nullable(), salePrice: amount,
    status: z.string(), available: z.number().int().nonnegative(),
})).max(100),
    missingProductIds: z.array(id),
});
const reservationLines = z.array(z.object({
    productId: id, quantity: z.number().int().positive(),
}));
export const reservationSchema = z.object({
    reservationId: id,
    status: z.enum(['PENDING', 'CONFIRMED', 'RELEASED', 'EXPIRED']),
    expiresAt: z.iso.datetime(), lines: reservationLines,
});
export const cleanupSchema = z.object({
    removedProductIds: z.array(id), skippedProductIds: z.array(id),
});
export const stockReturnSchema = z.object({
    returnId: id, orderId: id, reservationId: id,
    status: z.literal('RETURNED'), lines: reservationLines, createdAt: z.iso.datetime(),
});
export type CartSnapshot = z.infer<typeof cartSnapshotSchema>;
export type CartCheckoutSnapshot = z.infer<typeof cartResponseSchema>;
export type AddressSnapshot = z.infer<typeof addressSchema>;
export type ItemSnapshot = z.infer<typeof itemSchema>;
export type ReservationView = z.infer<typeof reservationSchema>;
export type ReservationLine = ReservationView['lines'][number];