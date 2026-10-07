import { authClient } from "./client";
import type { ShippingFormData } from "@/types/cart";

export type OrderView = {
  id: string;
  status: "PLACED" | "CANCELLATION_PENDING" | "SHIPPING" | "DELIVERED" | "CANCELLED";
  totalAmount: number;
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  placedAt: string | null;
  createdAt: string;
  items: {
    id: string; productId: string; productName: string; quantity: number;
    unitPrice: number; lineTotal: number; image?: string | null;
  }[];
  address: {
    recipientName: string; phone: string; addressLine: string;
    ward: string; district: string; city: string; note?: string | null;
  } | null;
};

export type WarrantyView = {
  id: string;
  orderItemId: string;
  orderId: string;
  status: "OPEN" | "IN_REVIEW" | "APPROVED" | "REJECTED" | "CLOSED";
  reason: string;
  description?: string | null;
  createdAt: string;
  item: { productName: string; productId: string; quantity: number };
};

type Page<T> = { items: T[]; page: number; pageSize: number; totalItems: number; totalPages: number };
export async function checkout(form: ShippingFormData, key: string): Promise<OrderView> {
  const { data } = await authClient.post<OrderView>("/api/orders", {
    recipientName: form.fullName.trim(), phone: form.phone.trim(),
    addressLine: form.addressLine.trim(), ward: form.ward.trim(),
    district: form.district.trim(), city: form.city.trim(),
    note: form.note.trim(), paymentMethod: "COD",
  }, { headers: { "Idempotency-Key": key } });
  return data;
}
export async function listOrders(page = 1, status?: string): Promise<Page<OrderView>> {
  const query = new URLSearchParams({ page: String(page), pageSize: "20" });
  if (status) query.set("status", status);
  const { data } = await authClient.get<Page<OrderView>>(`/api/orders?${query}`);
  return data;
}
export async function getOrder(id: string): Promise<OrderView> {
  const { data } = await authClient.get<OrderView>(`/api/orders/${encodeURIComponent(id)}`);
  return data;
}
export async function cancelOrder(id: string): Promise<OrderView> {
  const { data } = await authClient.post<OrderView>(`/api/orders/${encodeURIComponent(id)}/cancel`);
  return data;
}
export async function listWarranties(page = 1): Promise<Page<WarrantyView>> {
  const { data } = await authClient.get<Page<WarrantyView>>(`/api/warranties?page=${page}&pageSize=20`);
  return data;
}
export async function createWarranty(orderItemId: string, reason: string, description: string): Promise<WarrantyView> {
  const { data } = await authClient.post<WarrantyView>("/api/warranties", { orderItemId, reason, description });
  return data;
}
