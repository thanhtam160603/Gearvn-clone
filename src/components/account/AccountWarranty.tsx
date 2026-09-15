import { ShieldCheckIcon } from "@heroicons/react/24/outline";

import { mockWarrantyRequests } from "@/data/account-data";

const statusLabels = {
  received: "Đã tiếp nhận",
  processing: "Đang xử lý",
  completed: "Hoàn tất",
} as const;

export default function AccountWarranty() {
  return (
    <section className="min-h-[260px] rounded-xl bg-white p-5 shadow-sm">
      <h1 className="text-xl font-bold text-neutral-900">Yêu cầu bảo hành</h1>

      <div className="mt-5 space-y-3">
        {mockWarrantyRequests.length === 0 ? (
          <div className="flex min-h-44 flex-col items-center justify-center rounded-lg border border-dashed border-neutral-300 px-4 text-center">
            <ShieldCheckIcon className="size-10 text-neutral-300" />
            <p className="mt-3 text-sm font-semibold text-neutral-800">
              Bạn chưa có yêu cầu bảo hành
            </p>
            <p className="mt-1 text-xs text-neutral-500">
              Các yêu cầu bảo hành sẽ được hiển thị tại đây.
            </p>
          </div>
        ) : (
          mockWarrantyRequests.map((request) => (
            <article key={request.id} className="rounded-lg border border-neutral-200 p-4">
              <div className="flex items-center justify-between gap-3">
                <strong className="text-sm">{request.code}</strong>
                <span className="text-xs font-medium text-[var(--gearvn-red)]">
                  {statusLabels[request.status]}
                </span>
              </div>
              <p className="mt-2 text-sm text-neutral-700">{request.productName}</p>
              <p className="mt-2 text-xs text-neutral-500">{request.createdAt}</p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
