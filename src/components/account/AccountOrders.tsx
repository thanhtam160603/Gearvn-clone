"use client";

import { useMemo, useState } from "react";
import { MagnifyingGlassIcon, ShoppingBagIcon } from "@heroicons/react/24/outline";

import { mockAccountOrders } from "@/data/account-data";
import { formatPrice } from "@/lib/format-price";
import type { AccountOrderStatus } from "@/types/account";

const orderTabs: { value: AccountOrderStatus; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "processing", label: "Đang xử lý" },
  { value: "shipping", label: "Đang giao" },
  { value: "completed", label: "Hoàn tất" },
  { value: "cancelled", label: "Đã hủy" },
  { value: "returned", label: "Trả hàng" },
];

const statusLabels: Record<Exclude<AccountOrderStatus, "all">, string> = {
  processing: "Đang xử lý",
  shipping: "Đang giao",
  completed: "Hoàn tất",
  cancelled: "Đã hủy",
  returned: "Trả hàng",
};

export default function AccountOrders() {
  const [status, setStatus] = useState<AccountOrderStatus>("all");
  const [query, setQuery] = useState("");

  const filteredOrders = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("vi");

    return mockAccountOrders.filter((order) => {
      const matchesStatus = status === "all" || order.status === status;
      const searchableText = [order.code, ...order.productNames]
        .join(" ")
        .toLocaleLowerCase("vi");

      return matchesStatus && searchableText.includes(normalizedQuery);
    });
  }, [query, status]);

  return (
    <section className="rounded-xl bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-xl font-bold text-neutral-900">Đơn hàng của tôi</h1>
        <label className="relative block w-full md:max-w-[330px]">
          <span className="sr-only">Tìm kiếm đơn hàng</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm tên đơn, mã đơn hoặc sản phẩm"
            className="h-10 w-full rounded-full border border-neutral-300 pl-4 pr-10 text-sm outline-none focus:border-[var(--gearvn-red)]"
          />
          <MagnifyingGlassIcon className="pointer-events-none absolute right-3 top-1/2 size-5 -translate-y-1/2 text-neutral-400" />
        </label>
      </div>

      <div
        role="tablist"
        aria-label="Trạng thái đơn hàng"
        className="mt-4 flex overflow-x-auto border-b border-neutral-200"
      >
        {orderTabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={status === tab.value}
            onClick={() => setStatus(tab.value)}
            className={[
              "shrink-0 cursor-pointer border-b-2 px-4 py-3 text-sm transition",
              status === tab.value
                ? "border-[var(--gearvn-red)] font-medium text-[var(--gearvn-red)]"
                : "border-transparent text-neutral-600 hover:text-neutral-900",
            ].join(" ")}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="flex min-h-48 flex-col items-center justify-center rounded-lg border border-dashed border-neutral-300 px-4 text-center">
            <ShoppingBagIcon className="size-10 text-neutral-300" />
            <p className="mt-3 text-sm font-semibold text-neutral-800">
              Bạn chưa có đơn hàng phù hợp
            </p>
            <p className="mt-1 text-xs text-neutral-500">
              Các đơn hàng của bạn sẽ được hiển thị tại đây.
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <article key={order.id} className="rounded-lg border border-neutral-200 p-4">
              <div className="flex items-center justify-between gap-3">
                <strong className="text-sm text-neutral-900">{order.code}</strong>
                <span className="text-xs font-medium text-[var(--gearvn-red)]">
                  {statusLabels[order.status]}
                </span>
              </div>
              <p className="mt-2 text-sm text-neutral-600">
                {order.productNames.join(", ")}
              </p>
              <div className="mt-3 flex justify-between text-xs text-neutral-500">
                <span>{order.createdAt}</span>
                <strong className="text-sm text-[var(--gearvn-red)]">
                  {formatPrice(order.total)}
                </strong>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
