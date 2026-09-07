"use client";

import { useEffect, useState } from "react";

import type { ShippingFormData } from "@/types/cart";
import CartItemStep from "./CartItemStep";
import CartStepIndicator, { type CartStepId } from "./CartStepIndicator";
import CartSummary from "./CartSummary";
import ShippingInforStep from "./ShippingInforStep";

export default function CartPageContent() {
  const [currentStep, setCurrentStep] = useState<CartStepId>("cart");
  const [shippingInfo, setShippingInfo] = useState<ShippingFormData | null>(
    null,
  );

  useEffect(() => {
    const step = new URLSearchParams(window.location.search).get("step");

    if (step === "shipping" || step === "confirmation") {
      setCurrentStep(step);
    }
  }, []);

  const goToStep = (step: CartStepId) => {
    setCurrentStep(step);

    const url = new URL(window.location.href);

    if (step === "cart") {
      url.searchParams.delete("step");
    } else {
      url.searchParams.set("step", step);
    }

    window.history.replaceState({}, "", url);
  };

  return (
    <main className="min-h-screen bg-[#f5f5f5] py-6">
      <div className="mx-auto w-[calc(100%-32px)] max-w-[1000px]">
        <div className="mb-5 text-sm text-neutral-500">
          <span className="font-medium text-neutral-900">Trang chủ</span>
          <span className="mx-2">/</span>
          <span>Giỏ hàng</span>
        </div>

        <CartStepIndicator currentStep={currentStep} />

        <div className="mt-5 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0">
            {currentStep === "cart" && (
              <CartItemStep
                onNext={() => goToStep("shipping")}
              />
            )}

            {currentStep === "shipping" && (
              <ShippingInforStep
                onBack={() => goToStep("cart")}
                onChange={(data) => {
                  setShippingInfo(data);
                  goToStep("confirmation");
                }}
              />
            )}

            {currentStep === "confirmation" && (
              <section className="rounded-lg bg-white p-5">
                <h1 className="text-lg font-semibold text-neutral-900">
                  Xác nhận đơn hàng
                </h1>

                <p className="mt-3 text-sm text-neutral-600">
                  Kiểm tra lại thông tin giao hàng trước khi đặt hàng.
                </p>

                {shippingInfo && (
                  <div className="mt-4 rounded-lg bg-neutral-50 p-4 text-sm text-neutral-700">
                    <p className="font-semibold text-neutral-900">
                      {shippingInfo.fullName}
                    </p>
                    <p className="mt-1">{shippingInfo.phone}</p>
                    {shippingInfo.email && <p>{shippingInfo.email}</p>}
                    <p className="mt-2">{shippingInfo.address || "Chưa có địa chỉ"}</p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => goToStep("shipping")}
                  className="mt-5 rounded-lg bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
                >
                  Quay lại
                </button>
              </section>
            )}
          </div>

          <CartSummary canSubmit={currentStep === "confirmation"} />
        </div>
      </div>
    </main>
  );
}
