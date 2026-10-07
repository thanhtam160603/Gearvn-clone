"use client";
import { CheckIcon } from "@heroicons/react/24/solid";
import { useAppDispatch, useAppSelector } from "@/hooks/redux-hooks";
import { selectCartTotalQuantity, selectDetailedCartItems } from "@/store/cart-selectors";
import { removeItem, setSelection } from "@/store/cart-slice";
import CartItemRow from "./CartItemRow";

export default function CartItemStep({ onNext }: { onNext: () => void }) {
  const dispatch = useAppDispatch();
  const items = useAppSelector(selectDetailedCartItems);
  const totalQuantity = useAppSelector(selectCartTotalQuantity);
  const status = useAppSelector((state) => state.cart.status);
  const error = useAppSelector((state) => state.cart.error);
  const warning = useAppSelector((state) => state.cart.warning);
  const selected = items.filter((item) => item.selected);
  const allSelected = items.length > 0 && selected.length === items.length;
  const canContinue = selected.length > 0 && selected.every((item) => item.canCheckout);
  const selectAll = async () => {
    for (const item of items) {
      if (item.selected === allSelected) await dispatch(setSelection({ productId: item.productId, selected: !allSelected }));
    }
  };
  const removeSelected = async () => {
    for (const item of selected) await dispatch(removeItem({ productId: item.productId }));
  };
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between rounded-lg bg-white p-4">
        <button type="button" role="checkbox" aria-checked={allSelected} onClick={() => void selectAll()} className="flex items-center gap-3 text-sm font-medium">
          <span className={`flex size-5 items-center justify-center rounded border ${allSelected ? "border-red-600 bg-red-600" : "border-neutral-300"}`}>
            {allSelected && <CheckIcon className="size-3.5 text-white" />}
          </span>
          Tất cả sản phẩm ({totalQuantity})
        </button>
        <button type="button" onClick={() => void removeSelected()} disabled={!selected.length} className="text-sm text-red-600 disabled:opacity-40">Xóa đã chọn</button>
      </div>
      {status === "loading" && !items.length && <p className="rounded-lg bg-white p-4 text-sm">Đang tải giỏ hàng...</p>}
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {warning && <p role="status" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">{warning}</p>}
      {items.map((item) => <CartItemRow key={item.productId} item={item} variant="page" onSelectChange={(value) => void dispatch(setSelection({ productId: item.productId, selected: value }))} />)}
      {!items.length && status !== "loading" && <p className="rounded-lg bg-white p-6 text-center text-sm text-neutral-500">Giỏ hàng của bạn đang trống.</p>}
      <button type="button" onClick={onNext} disabled={!canContinue} className="self-end rounded-lg bg-red-600 px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-neutral-300">Tiếp theo</button>
    </div>
  );
}
