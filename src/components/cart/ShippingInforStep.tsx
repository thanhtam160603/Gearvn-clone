"use client";

import { useState, type ChangeEvent } from "react";
import { FaMoneyBillWave } from "react-icons/fa";
import type { ShippingFormData } from "@/types/cart";
import ShippingOrderProducts from "./ShippingOrderProducts";

type ShippingInforStepProps = {
  onBack: () => void;
  onChange: (data: ShippingFormData) => void;
  selectedIds: string[];
};

const initialFormData: ShippingFormData = {
  fullName: "",
  phone: "",
  email: "",
  citizenId: "",
  deliveryMethod: "home",
  address: "",
  shippingMethod: "standard",
  specialRequests: {
    installation: false,
    otherReceiver: false,
    technicalSupport: false,
  },
  note: "",
  paymentMethod: "cod",
};

export default function ShippingInforStep({
  onBack,
  onChange,
  selectedIds,
}: ShippingInforStepProps) {
  const [form, setFormData] = useState<ShippingFormData>(initialFormData);

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleDeliveryMethodChange = (
    deliveryMethod: ShippingFormData["deliveryMethod"],
  ) => {
    setFormData((current) => ({
      ...current,
      deliveryMethod,
    }));
  };

  const handleSpecialRequestChange = (
    request: keyof ShippingFormData["specialRequests"],
  ) => {
    setFormData((current) => ({
      ...current,
      specialRequests: {
        ...current.specialRequests,
        [request]: !current.specialRequests[request],
      },
    }));
  };

  const handleContinue = () => {
    onChange(form);
  };

  return (
    <div className="space-y-4">
      <ShippingOrderProducts selectedIds={selectedIds} />

      <section className="rounded-lg bg-white p-4">
        <h2 className="text-base font-semibold text-neutral-900">
          Thông tin người đặt hàng
        </h2>

        <p className="mt-1 text-xs text-red-500">
          (*) Trường thông tin bắt buộc điền
        </p>

        <div className="mt-4 space-y-2">
          <input
            name="fullName"
            value={form.fullName}
            onChange={handleChange}
            placeholder="Họ và tên *"
            required
            className="h-11 w-full rounded-lg border border-neutral-300 px-3 outline-none focus:border-blue-500"
          />

          <input
            type="tel"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="Số điện thoại *"
            required
            className="h-11 w-full rounded-lg border border-neutral-300 px-3 outline-none focus:border-blue-500"
          />

          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Email"
            className="h-11 w-full rounded-lg border border-neutral-300 px-3 outline-none focus:border-blue-500"
          />

          <input
            name="citizenId"
            value={form.citizenId}
            onChange={handleChange}
            placeholder="Số CCCD/CMND (không bắt buộc)"
            className="h-11 w-full rounded-lg border border-neutral-300 px-3 outline-none focus:border-blue-500"
          />
        </div>

        <p className="mt-2 text-xs text-neutral-500">
          Thông tin được bảo mật và chỉ sử dụng khi cần xác nhận đơn hàng.
        </p>
      </section>

      <section className="rounded-lg bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-neutral-900">
            Hình thức nhận hàng
          </h2>

          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-neutral-800">
              <input
                type="radio"
                name="deliveryMethod"
                value="home"
                checked={form.deliveryMethod === "home"}
                onChange={() => handleDeliveryMethodChange("home")}
                className="size-4 accent-blue-600"
              />
              Giao hàng tận nơi
            </label>

            <label className="flex items-center gap-2 text-sm text-neutral-800">
              <input
                type="radio"
                name="deliveryMethod"
                value="store"
                checked={form.deliveryMethod === "store"}
                onChange={() => handleDeliveryMethodChange("store")}
                className="size-4 accent-blue-600"
              />
              Nhận tại cửa hàng
            </label>
          </div>
        </div>

        <button
          type="button"
          className="mt-4 flex h-12 w-full items-center justify-between rounded-lg border border-neutral-300 px-3 text-left text-sm text-neutral-500 transition hover:border-blue-500"
        >
          <span>
            {form.deliveryMethod === "home"
              ? "Thêm địa chỉ nhận hàng *"
              : "Chọn cửa hàng nhận hàng *"}
          </span>
          <span className="text-xl leading-none">›</span>
        </button>

        <button
          type="button"
          className="mt-3 rounded-md bg-orange-50 px-3 py-2 text-xs text-orange-600 transition hover:bg-orange-100"
        >
          Sử dụng địa chỉ trước đó
        </button>
      </section>

      <section className="rounded-lg bg-white p-4">
        <h2 className="text-base font-semibold text-neutral-900">
          Phương thức vận chuyển
        </h2>

        <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-lg border border-blue-500 bg-blue-50 p-3 text-sm text-neutral-800">
          <input
            type="radio"
            name="shippingMethod"
            value="standard"
            checked={form.shippingMethod === "standard"}
            onChange={() =>
              setFormData((current) => ({
                ...current,
                shippingMethod: "standard",
              }))
            }
            className="size-4 accent-blue-600"
          />
          <span>Vận chuyển tiêu chuẩn</span>
        </label>
      </section>

      <section className="rounded-lg bg-white p-4">
        <h2 className="text-base font-semibold text-neutral-900">
          Yêu cầu đặc biệt
        </h2>

        <div className="mt-4 space-y-4">
          <label className="flex cursor-pointer items-center gap-3 text-sm text-neutral-800">
            <input
              type="checkbox"
              checked={form.specialRequests.installation}
              onChange={() => handleSpecialRequestChange("installation")}
              className="size-4 accent-blue-600"
            />
            <span>Tôi cần hỗ trợ lắp đặt/cài đặt</span>
            <span
              title="Nhân viên sẽ liên hệ để tư vấn thêm về việc lắp đặt"
              className="flex size-4 items-center justify-center rounded-full border border-neutral-400 text-[10px] text-neutral-500"
            >
              ?
            </span>
          </label>

          <label className="flex cursor-pointer items-center gap-3 text-sm text-neutral-800">
            <input
              type="checkbox"
              checked={form.specialRequests.otherReceiver}
              onChange={() => handleSpecialRequestChange("otherReceiver")}
              className="size-4 accent-blue-600"
            />
            <span>Nhờ người khác nhận hàng</span>
          </label>

          <label className="flex cursor-pointer items-center gap-3 text-sm text-neutral-800">
            <input
              type="checkbox"
              checked={form.specialRequests.technicalSupport}
              onChange={() => handleSpecialRequestChange("technicalSupport")}
              className="size-4 accent-blue-600"
            />
            <span>Yêu cầu hỗ trợ kỹ thuật</span>
            <span
              title="Nhân viên kỹ thuật sẽ liên hệ để hỗ trợ"
              className="flex size-4 items-center justify-center rounded-full border border-neutral-400 text-[10px] text-neutral-500"
            >
              ?
            </span>
          </label>
        </div>
      </section>

      <section className="rounded-lg bg-white p-4">
        <h2 className="text-base font-semibold text-neutral-900">
          Chọn hình thức thanh toán
        </h2>

        <label className="mt-4 flex cursor-pointer items-center gap-3">
          <input
            type="radio"
            name="paymentMethod"
            value="cod"
            checked={form.paymentMethod === "cod"}
            onChange={() =>
              setFormData((current) => ({
                ...current,
                paymentMethod: "cod",
              }))
            }
            className="size-4 accent-blue-600"
          />

          <FaMoneyBillWave className="size-5 text-red-500" />

          <span className="flex flex-col">
            <span className="text-sm font-medium text-neutral-900">COD</span>
            <span className="text-xs text-neutral-500">
              Thu tiền khi giao hàng
            </span>
          </span>
        </label>
      </section>

      <div className="border-t border-neutral-200 pt-4">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            className="rounded-lg bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
          >
            Quay lại
          </button>

          <button
            type="button"
            onClick={handleContinue}
            className="rounded-lg bg-[var(--gearvn-red)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            Tiếp theo
          </button>
        </div>
      </div>
    </div>
  );
}
