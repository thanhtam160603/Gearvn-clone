"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { listWarranties } from "@/lib/api/orders";
import type { WarrantyView } from "@/lib/api/orders";

const statusText: Record<WarrantyView["status"], string> = {
  OPEN: "Đã tiếp nhận", IN_REVIEW: "Đang xem xét", APPROVED: "Đã duyệt", REJECTED: "Từ chối", CLOSED: "Đã đóng",
};
export default function AccountWarranty() {
  const [items, setItems] = useState<WarrantyView[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    void listWarranties(page).then((result) => { if (active) { setItems(result.items); setTotalPages(result.totalPages); setLoading(false); setError(""); } })
      .catch((caught: unknown) => { if (active) { setError(caught instanceof Error ? caught.message : "Không tải được yêu cầu bảo hành."); setLoading(false); } });
    return () => { active = false; };
  }, [page, retry]);
  return <section className="min-h-[260px] rounded-xl bg-white p-5 shadow-sm">
    <h1 className="text-xl font-bold">Yêu cầu bảo hành</h1>
    {loading && <p className="mt-5 text-sm text-neutral-500">Đang tải yêu cầu...</p>}
    {error && <p role="alert" className="mt-5 text-sm text-red-700">{error} <button type="button" onClick={() => { setLoading(true); setRetry((value) => value + 1); }} className="underline">Thử lại</button></p>}
    {!loading && !error && <div className="mt-5 space-y-3">
      {!items.length && <p className="rounded-lg border border-dashed p-6 text-center text-sm text-neutral-500">Bạn chưa có yêu cầu bảo hành.</p>}
      {items.map((request) => <article key={request.id} className="rounded-lg border p-4">
        <div className="flex justify-between gap-3 text-sm"><strong>Yêu cầu #{request.id.slice(0, 8)}</strong><span className="text-red-600">{statusText[request.status]}</span></div>
        <p className="mt-2 text-sm">{request.item.productName}</p><p className="mt-1 text-xs text-neutral-500">{request.reason}</p>
        <div className="mt-2 flex justify-between text-xs text-neutral-500"><time>{new Date(request.createdAt).toLocaleDateString("vi-VN")}</time><Link href={`/account/orders/${request.orderId}`} className="text-red-600 underline">Xem đơn hàng</Link></div>
      </article>)}
      {totalPages > 1 && <div className="flex justify-center gap-4 text-sm"><button type="button" disabled={page <= 1} onClick={() => { setPage(page - 1); setLoading(true); }} className="disabled:opacity-40">Trước</button><span>{page} / {totalPages}</span><button type="button" disabled={page >= totalPages} onClick={() => { setPage(page + 1); setLoading(true); }} className="disabled:opacity-40">Sau</button></div>}
    </div>}
  </section>;
}
