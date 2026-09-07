"use client";

import { formatPrice } from "@/lib/format-price";

type CartSummaryProps = {
  canSubmit?: boolean;
  subtotal: number;
};

export default function CartSummary({
  canSubmit = false,
  subtotal,
}: CartSummaryProps) {
  const productDiscount = 0;
  const shippingFee = 0;
  const voucherDiscount = 0;
  const total = subtotal - productDiscount + shippingFee - voucherDiscount;

  return (
    <aside className="space-y-4 lg:sticky lg:top-24">
      <section className="flex items-center justify-between rounded-lg bg-white px-4 py-3">
        <span className="text-sm font-medium text-neutral-800">
          Quà tặng (0)
        </span>

        <button
          type="button"
          className="text-xs font-medium text-neutral-400 transition hover:text-[var(--gearvn-red)]"
        >
          Xem quà
        </button>
      </section>

      <section className="rounded-lg bg-white p-4">
        <h2 className="text-sm font-semibold text-neutral-900">
          Chi tiết thanh toán
        </h2>

        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="text-neutral-500">Tổng giá sản phẩm</span>
            <span className="font-medium text-neutral-900">
              {formatPrice(subtotal)}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="text-neutral-500">Giảm giá sản phẩm</span>
            <span className="font-medium text-red-600">
              -{formatPrice(productDiscount)}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="text-neutral-500">Tạm tính sau giảm</span>
            <span className="font-medium text-neutral-900">
              {formatPrice(subtotal - productDiscount)}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="text-neutral-500">Tổng tiền phí vận chuyển</span>
            <span className="font-medium text-neutral-900">
              {formatPrice(shippingFee)}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="text-neutral-500">Tổng cộng Voucher giảm giá</span>
            <span className="font-medium text-red-600">
              -{formatPrice(voucherDiscount)}
            </span>
          </div>
        </div>

        <div className="my-4 border-t border-neutral-200" />

        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-medium text-neutral-500">
            Tổng tiền thanh toán
          </span>
          <strong className="text-base font-bold text-[var(--gearvn-red)]">
            {formatPrice(total)}
          </strong>
        </div>

        <button
          type="button"
          disabled={!canSubmit}
          className="mt-4 h-11 w-full rounded-lg bg-neutral-100 text-sm font-semibold text-neutral-400 transition enabled:bg-[var(--gearvn-red)] enabled:text-white enabled:hover:bg-red-700 disabled:cursor-not-allowed"
        >
          Đặt mua hàng
        </button>

        <p className="mt-3 text-[11px] leading-4 text-neutral-500">
          Nhấn “Đặt mua hàng” đồng nghĩa với việc bạn đồng ý tuân theo
          <a href="#terms" className="ml-1 text-blue-600 underline">
            Điều khoản dịch vụ của GearVN
          </a>
        </p>
      </section>
    </aside>
  );
}
