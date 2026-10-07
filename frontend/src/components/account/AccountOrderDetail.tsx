"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { cancelOrder, createWarranty, getOrder } from "@/lib/api/orders";
import type { OrderView } from "@/lib/api/orders";
import { formatPrice } from "@/lib/format-price";

const statusText: Record<OrderView["status"], string> = {
  PLACED: "Đã đặt", CANCELLATION_PENDING: "Đang hủy", SHIPPING: "Đang giao", DELIVERED: "Đã giao", CANCELLED: "Đã hủy",
};
export default function AccountOrderDetail({ id }: { id: string }) {
  const [order, setOrder] = useState<OrderView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [warrantyItemId, setWarrantyItemId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    void getOrder(id).then((result) => { if (active) { setOrder(result); setError(""); setLoading(false); } })
      .catch((caught: unknown) => { if (active) { setError(caught instanceof Error ? caught.message : "Không tải được đơn hàng."); setLoading(false); } });
    return () => { active = false; };
  }, [id, retry]);
  const cancel = async () => {
    if (!order || busy || !window.confirm("Bạn muốn hủy đơn hàng này?")) return;
    setBusy(true); setError("");
    try { setOrder(await cancelOrder(id)); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Không hủy được đơn hàng."); }
    finally { setBusy(false); }
  };
  const submitWarranty = async () => {
    if (!warrantyItemId || !reason.trim() || busy) return;
    setBusy(true); setError("");
    try { await createWarranty(warrantyItemId, reason.trim(), description.trim()); setWarrantyItemId(null); setReason(""); setDescription(""); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Không gửi được yêu cầu bảo hành."); }
    finally { setBusy(false); }
  };
  return <section className="rounded-xl bg-white p-4 shadow-sm sm:p-5">
    <Link href="/account/orders" className="text-sm text-red-600">← Đơn hàng của tôi</Link>
    <h1 className="mt-3 text-xl font-bold">Chi tiết đơn #{id.slice(0, 8)}</h1>
    {loading && <p className="mt-4 text-sm text-neutral-500">Đang tải đơn hàng...</p>}
    {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error} {!order && <button type="button" onClick={() => { setLoading(true); setRetry((value) => value + 1); }} className="underline">Thử lại</button>}</p>}
    {order && <>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><p className="text-sm">Trạng thái: <strong className="text-red-600">{statusText[order.status]}</strong></p>
        {order.status === "PLACED" && <button type="button" disabled={busy} onClick={() => void cancel()} className="rounded-lg border border-red-600 px-4 py-2 text-sm text-red-600 disabled:opacity-50">Hủy đơn</button>}</div>
      <div className="mt-4 space-y-3">{order.items.map((item) => <article key={item.id} className="rounded-lg border p-3">
        <div className="flex justify-between gap-3 text-sm"><strong>{item.productName}</strong><span>x{item.quantity}</span></div>
        <p className="mt-1 text-sm text-red-600">{formatPrice(item.lineTotal)}</p>
        {order.status === "DELIVERED" && <button type="button" onClick={() => { setWarrantyItemId(item.id); setError(""); }} className="mt-2 text-xs font-medium text-red-600 underline">Yêu cầu bảo hành</button>}
      </article>)}</div>
      {order.address && <div className="mt-4 rounded-lg bg-neutral-50 p-4 text-sm"><strong>Địa chỉ giao hàng</strong><p>{order.address.recipientName} · {order.address.phone}</p><p>{[order.address.addressLine, order.address.ward, order.address.district, order.address.city].join(", ")}</p></div>}
      <p className="mt-4 text-right text-lg font-bold text-red-600">Tổng cộng: {formatPrice(order.totalAmount)}</p>
      {warrantyItemId && <div className="mt-5 rounded-lg border p-4"><h2 className="font-semibold">Yêu cầu bảo hành</h2>
        <label className="mt-3 block text-sm">Lý do *<input value={reason} onChange={(event) => setReason(event.target.value)} maxLength={200} className="mt-1 h-10 w-full rounded border px-3" /></label>
        <label className="mt-3 block text-sm">Mô tả<textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={2000} rows={3} className="mt-1 w-full rounded border p-3" /></label>
        <div className="mt-3 flex gap-3"><button type="button" disabled={busy || !reason.trim()} onClick={() => void submitWarranty()} className="rounded bg-red-600 px-4 py-2 text-sm text-white disabled:opacity-40">Gửi yêu cầu</button><button type="button" onClick={() => setWarrantyItemId(null)} className="text-sm">Đóng</button></div>
      </div>}
    </>}
  </section>;
}
