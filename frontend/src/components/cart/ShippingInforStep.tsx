"use client";
import { useState, type ChangeEvent } from "react";
import type { ShippingFormData } from "@/types/cart";
import ShippingOrderProducts from "./ShippingOrderProducts";

type Props = { onBack: () => void; onChange: (data: ShippingFormData) => void; selectedIds: string[] };
const emptyForm: ShippingFormData = { fullName: "", phone: "", addressLine: "", ward: "", district: "", city: "", note: "", paymentMethod: "COD" };
const fields: { name: keyof ShippingFormData; label: string; required: boolean }[] = [
  { name: "fullName", label: "Họ và tên người nhận", required: true },
  { name: "phone", label: "Số điện thoại", required: true },
  { name: "addressLine", label: "Số nhà, tên đường", required: true },
  { name: "ward", label: "Phường / xã", required: true },
  { name: "district", label: "Quận / huyện", required: true },
  { name: "city", label: "Tỉnh / thành phố", required: true },
];
export default function ShippingInforStep({ onBack, onChange, selectedIds }: Props) {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const change = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    setError("");
  };
  const continueToConfirm = () => {
    if (fields.some(({ name }) => !form[name].trim())) {
      setError("Vui lòng điền đủ thông tin giao hàng.");
      return;
    }
    onChange(Object.fromEntries(Object.entries(form).map(([key, value]) => [key, value.trim()])) as ShippingFormData);
  };
  return (
    <div className="space-y-4">
      <ShippingOrderProducts selectedIds={selectedIds} />
      <section className="rounded-lg bg-white p-4">
        <h2 className="text-base font-semibold">Thông tin giao hàng</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {fields.map(({ name, label, required }) => <label key={name} className="text-sm text-neutral-700">{label} {required && "*"}
            <input name={name} value={form[name]} onChange={change} required={required} autoComplete={name === "fullName" ? "name" : name === "phone" ? "tel" : undefined}
              className="mt-1 h-11 w-full rounded-lg border border-neutral-300 px-3 outline-none focus:border-blue-500" />
          </label>)}
        </div>
        <label className="mt-3 block text-sm text-neutral-700">Ghi chú
          <textarea name="note" value={form.note} onChange={change} maxLength={500} rows={3} className="mt-1 w-full rounded-lg border border-neutral-300 p-3" />
        </label>
      </section>
      <section className="rounded-lg bg-white p-4"><h2 className="font-semibold">Thanh toán</h2><p className="mt-2 text-sm">COD — Thanh toán khi nhận hàng</p></section>
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="flex justify-between">
        <button type="button" onClick={onBack} className="rounded-lg bg-neutral-900 px-5 py-3 text-sm font-semibold text-white">Quay lại</button>
        <button type="button" onClick={continueToConfirm} className="rounded-lg bg-red-600 px-6 py-3 text-sm font-semibold text-white">Tiếp theo</button>
      </div>
    </div>
  );
}
