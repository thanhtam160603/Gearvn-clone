"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { listOrders } from "@/lib/api/orders";
import type { OrderView } from "@/lib/api/orders";
import { formatPrice } from "@/lib/format-price";

const tabs = [
  { value: "", label: "Tất cả" }, { value: "PLACED", label: "Đã đặt" },
  { value: "CANCELLATION_PENDING", label: "Đang hủy" }, { value: "SHIPPING", label: "Đang giao" },
  { value: "DELIVERED", label: "Đã giao" }, { value: "CANCELLED", label: "Đã hủy" },
] as const;
const statusLabel = Object.fromEntries(tabs.map((tab) => [tab.value, tab.label]));
export default function AccountOrders() {
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [orders, setOrders] = useState<OrderView[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    void listOrders(page, status || undefined).then((result) => {
      if (!active) return;
      setOrders(result.items); setTotalPages(result.totalPages); setError(""); setLoading(false);
    }).catch((caught: unknown) => {
      if (!active) return;
      setError(caught instanceof Error ? caught.message : "Không tải được đơn hàng."); setLoading(false);
    });
    return () => { active = false; };
  }, [page, status, retry]);
  return <section className="rounded-xl bg-white p-4 shadow-sm sm:p-5">
    <h1 className="text-xl font-bold">Đơn hàng của tôi</h1>
    <div role="tablist" aria-label="Trạng thái đơn hàng" className="mt-4 flex overflow-x-auto border-b">
      {tabs.map((tab) => <button key={tab.value} type="button" role="tab" aria-selected={status === tab.value}
        onClick={() => { setStatus(tab.value); setPage(1); setLoading(true); }}
        className={`shrink-0 border-b-2 px-3 py-3 text-sm ${status === tab.value ? "border-red-600 text-red-600" : "border-transparent text-neutral-600"}`}>{tab.label}</button>)}
    </div>
    {loading && <p className="mt-5 text-sm text-neutral-500">Đang tải đơn hàng...</p>}
    {error && <div role="alert" className="mt-5 text-sm text-red-700">{error} <button type="button" onClick={() => { setLoading(true); setRetry((value) => value + 1); }} className="underline">Thử lại</button></div>}
    {!loading && !error && <div className="mt-4 space-y-3">
      {orders.length === 0 && <p className="rounded-lg border border-dashed p-6 text-center text-sm text-neutral-500">Chưa có đơn hàng ở trạng thái này.</p>}
      {orders.map((order) => <Link href={`/account/orders/${order.id}`} key={order.id} className="block rounded-lg border p-4 hover:border-red-300">
        <div className="flex justify-between gap-3 text-sm"><strong>Đơn #{order.id.slice(0, 8)}</strong><span className="text-red-600">{statusLabel[order.status]}</span></div>
        <p className="mt-2 text-sm text-neutral-600">{order.items.map((item) => item.productName).join(", ")}</p>
        <div className="mt-3 flex justify-between text-xs text-neutral-500"><time>{new Date(order.createdAt).toLocaleDateString("vi-VN")}</time><strong className="text-sm text-red-600">{formatPrice(order.totalAmount)}</strong></div>
      </Link>)}
      {totalPages > 1 && <div className="flex items-center justify-center gap-4 pt-3 text-sm">
        <button type="button" disabled={page <= 1} onClick={() => { setPage(page - 1); setLoading(true); }} className="disabled:opacity-40">Trước</button>
        <span>{page} / {totalPages}</span>
        <button type="button" disabled={page >= totalPages} onClick={() => { setPage(page + 1); setLoading(true); }} className="disabled:opacity-40">Sau</button>
      </div>}
    </div>}
  </section>;
}
