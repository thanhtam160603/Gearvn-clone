"use client";

import { useAppDispatch, useAppSelector } from "@/hooks/redux-hooks";
import {
    selectCartTotalQuantity,
    selectDetailedCartItems,
} from "@/store/cart-selectors";
import { removeItem } from "@/store/cart-slice";
import CartItemRow from "./CartItemRow";
import { FaTrash } from "react-icons/fa";
import { CheckIcon } from "@heroicons/react/24/solid";

type CartItemStepProps = {
    onNext: () => void;
    selectedIds: string[];
    onSelectedIdsChange: (selectedIds: string[]) => void;
};


export default function CartItemStep({
    onNext,
    selectedIds,
    onSelectedIdsChange,
}: CartItemStepProps) {
    const cartItems = useAppSelector(selectDetailedCartItems);
    const totalQuantity = useAppSelector(selectCartTotalQuantity);
    const dispatch = useAppDispatch();

    const allSelected =
        cartItems.length > 0 && selectedIds.length === cartItems.length;

    const handleSelectAll = () => {
        onSelectedIdsChange(
            allSelected
                ? []
                : cartItems.map((item) => item.productId),
        );
    };

    const handleItemSelection = (productId: string, selected: boolean) => {
        if (selected) {
            onSelectedIdsChange(
                selectedIds.includes(productId)
                    ? selectedIds
                    : [...selectedIds, productId],
            );
            return;
        }

        onSelectedIdsChange(selectedIds.filter((id) => id !== productId));
    };

    const handleRemoveSelected = () => {
        selectedIds.forEach((productId) => {
            dispatch(removeItem({ productId }));
        });

        onSelectedIdsChange([]);
    };

    return (
        <div className="flex w-full flex-col gap-4">
            <div className="grid grid-cols-[minmax(0,1fr)_24px] items-center gap-4 rounded-lg bg-white px-4 py-3 md:grid-cols-[minmax(0,1fr)_120px_112px_24px]">
                <div className="flex min-w-0 items-center gap-4">
                    <button
                    type="button"
                    role="checkbox"
                    aria-checked={allSelected}
                    aria-label="Chọn tất cả sản phẩm"
                    onClick={handleSelectAll}
                    className={[
                        "flex size-5 items-center justify-center rounded border",
                        allSelected
                        ? "border-[var(--gearvn-red)] bg-[var(--gearvn-red)]"
                        : "border-neutral-300 bg-white",
                    ].join(" ")}
                    >
                    {allSelected && (
                        <CheckIcon className="size-3.5 text-white" />
                    )}
                    </button>
                    <span className="text-sm font-medium text-neutral-900">Tất cả sản phẩm ({totalQuantity})</span>
                </div>
                <span className="hidden text-sm font-normal text-neutral-600 md:block">
                    Đơn giá
                </span>
                <span className="hidden text-sm font-normal text-neutral-600 md:block">
                    Số lượng
                </span>
                <button
                    className="col-start-2 row-start-1 shrink-0 text-neutral-500 transition hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40 md:col-start-4"
                    aria-label="Xóa sản phẩm đã chọn"
                    type="button"
                    onClick={handleRemoveSelected}
                    disabled={selectedIds.length === 0}
                >
                    <FaTrash className="size-4" />
                </button>
            </div>
            <div className="flex flex-col gap-4">
                {cartItems.map((item) => (
                    <CartItemRow
                        key={item.productId}
                        item={item}
                        variant="page"
                        selected={selectedIds.includes(item.productId)}
                        onSelectChange={(selected) =>
                            handleItemSelection(item.productId, selected)
                        }
                    />
                ))}
            </div>

            <div className="flex items-center justify-end">
                <button 
                    type="button"
                    onClick={onNext}
                    disabled={selectedIds.length === 0}
                    className="rounded-lg bg-[var(--gearvn-red)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-neutral-300"
                >
                    Tiếp theo
                </button>
            </div>
        </div>
    );
}
