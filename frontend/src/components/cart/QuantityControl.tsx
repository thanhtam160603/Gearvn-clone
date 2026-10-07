"use client";
import { FaPlus, FaMinus } from "react-icons/fa";
import { useAppDispatch } from "@/hooks/redux-hooks";
import { increaseQuantity, decreaseQuantity } from "@/store/cart-slice";

type QuantityControlProps = {
    productId: string;
    quantity: number;
    stockQuantity: number;
};

export default function QuantityControl({
    productId,
    quantity,
    stockQuantity,}: QuantityControlProps) {
    const dispatch = useAppDispatch();

    const handleIncrement = () => {
        if (quantity < stockQuantity) {
            dispatch(
                increaseQuantity({
                    productId,
                    stockQuantity,
                })
            );
        }
    };

    const handleDecrement = () => {
        if (quantity > 1) {
            dispatch(
                decreaseQuantity({
                    productId,
                    stockQuantity,
                })
            );
        }
    };
    return (
        <div className="inline-flex h-8 items-center overflow-hidden rounded-md border border-neutral-300 bg-white">
            <button
                type="button"
                aria-label="Giảm số lượng"
                onClick={handleDecrement}
                disabled={quantity <= 1}
                className="flex size-8 items-center justify-center text-neutral-600 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-400 cursor-pointer"
            >
                <FaMinus className="size-3" />
            </button>
            <span className="min-w-8 text-center text-sm font-medium text-neutral-900">
                {quantity}
            </span>
            <button
                type="button"
                aria-label="Tăng số lượng"
                onClick={handleIncrement}
                disabled={quantity >= stockQuantity}
                className="flex size-8 items-center justify-center text-neutral-700 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-400 cursor-pointer"
            >
                <FaPlus className="size-3" />
            </button>
        </div>
    );
}
