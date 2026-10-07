"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { checkout } from "@/lib/api/orders";
import { ApiError } from "@/lib/api/client";
import { useAppDispatch, useAppSelector } from "@/hooks/redux-hooks";
import { selectDetailedCartItems, selectSelectedCartSubtotal } from "@/store/cart-selectors";
import { loadCart } from "@/store/cart-slice";
import { openLoginDialog } from "@/store/ui-slice";
import type { ShippingFormData } from "@/types/cart";
import CartItemStep from "./CartItemStep";
import CartStepIndicator, { type CartStepId } from "./CartStepIndicator";
import CartSummary from "./CartSummary";
import ShippingInforStep from "./ShippingInforStep";

export default function CartPageContent() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const items = useAppSelector(selectDetailedCartItems);
  const subtotal = useAppSelector(selectSelectedCartSubtotal);
  const authenticated = useAppSelector((state) => Boolean(state.auth.user && state.auth.accessToken));
  const [step, setStep] = useState<CartStepId>("cart");
  const [shipping, setShipping] = useState<ShippingFormData | null>(null);
  const [busy, setBusy] = useState(false);
  const [attemptStarted, setAttemptStarted] = useState(false);
  const [error, setError] = useState("");
  const keyRef = useRef<{ key: string; shipping: ShippingFormData } | null>(null);
  const selectedIds = items.filter((item) => item.selected).map((item) => item.productId);
  const canCheckout = selectedIds.length > 0 && items.filter((item) => item.selected).every((item) => item.canCheckout && item.status === "in-stock");

  const submit = async () => {
    if (!shipping || (!canCheckout && !keyRef.current) || busy) return;
    if (!authenticated) {
      dispatch(openLoginDialog("/cart"));
      setError("Vui lòng đăng nhập để đặt hàng.");
      return;
    }
    if (!keyRef.current) {
      keyRef.current = { key: crypto.randomUUID(), shipping };
      setAttemptStarted(true);
    }
    setBusy(true);
    setError("");
    try {
      const result = await checkout(keyRef.current.shipping, keyRef.current.key);
      keyRef.current = null;
      setAttemptStarted(false);
      await dispatch(loadCart());
      router.push(`/account/orders/${result.id}`);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Không thể đặt hàng. Vui lòng thử lại.");
      if (caught instanceof ApiError && caught.code === "CHECKOUT_FAILED") { keyRef.current = null; setAttemptStarted(false); }
      await dispatch(loadCart());
    } finally { setBusy(false); }
  };

  return (
    <main className="min-h-screen bg-[#f5f5f5] py-6">
      <div className="mx-auto w-[calc(100%-32px)] max-w-[1000px]">
        <div className="mb-5 text-sm text-neutral-500">Trang chủ / Giỏ hàng</div>
        <CartStepIndicator currentStep={step} />
        <div className="mt-5 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0">
            {step === "cart" && <CartItemStep onNext={() => setStep("shipping")} />}
            {step === "shipping" && <ShippingInforStep selectedIds={selectedIds} onBack={() => setStep("cart")}
              onChange={(data) => { setShipping(data); setStep("confirmation"); setError(""); }} />}
            {step === "confirmation" && <section className="rounded-lg bg-white p-5">
              <h1 className="text-lg font-semibold">Xác nhận đơn hàng</h1>
              {shipping && <div className="mt-4 rounded-lg bg-neutral-50 p-4 text-sm">
                <p className="font-semibold">{shipping.fullName}</p><p>{shipping.phone}</p>
                <p>{[shipping.addressLine, shipping.ward, shipping.district, shipping.city].join(", ")}</p>
                <p>Thanh toán khi nhận hàng</p>
              </div>}
              <button type="button" disabled={attemptStarted} onClick={() => setStep("shipping")} className="mt-5 rounded-lg bg-neutral-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-40">Sửa thông tin</button>
            </section>}
            {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          </div>
          <CartSummary subtotal={subtotal} canSubmit={step === "confirmation" && (canCheckout || attemptStarted) && !busy} onSubmit={() => void submit()} busy={busy} />
        </div>
      </div>
    </main>
  );
}
