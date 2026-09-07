"use client";

import Image from "next/image";
import Link from "next/link";
import { FiTrash2 } from "react-icons/fi";
import { CheckIcon } from "@heroicons/react/24/solid";

import type { DetailedCartItem } from "@/types/cart";
import { useAppDispatch } from "@/hooks/redux-hooks";
import { removeItem } from "@/store/cart-slice";
import { formatPrice } from "@/lib/format-price";
import QuantityControl from "./QuantityControl";

type CartItemRowProps = {
    item: DetailedCartItem;
    variant?: "drawer" | "page";
    selected?: boolean;
    onSelectChange?: (selected: boolean) => void;
};

export default function CartItemRow({
    item,
    variant = "drawer",
    selected = false,
    onSelectChange,
}: CartItemRowProps) {
    const dispatch = useAppDispatch();

    const { product, quantity, totalPrice } = item;

    const handleRemove = () => {
        dispatch(removeItem({ productId: product.id }));
    }

    if (variant === "page") {
        return (
            <article className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-100 md:grid-cols-[minmax(0,1fr)_120px_112px_24px] md:gap-4">
                <div className="flex min-w-0 items-center gap-3">
                    <button
                        type="button"
                        role="checkbox"
                        aria-checked={selected}
                        aria-label={`Chọn ${product.name}`}
                        onClick={() => onSelectChange?.(!selected)}
                        className={[
                            "flex size-5 shrink-0 items-center justify-center rounded border",
                            selected
                                ? "border-[var(--gearvn-red)] bg-[var(--gearvn-red)]"
                                : "border-neutral-300 bg-white",
                        ].join(" ")}
                    >
                        {selected && <CheckIcon className="size-3.5 text-white" />}
                    </button>

                    <Link
                        href={`/product/${product.slug}`}
                        className="relative size-[76px] shrink-0 overflow-hidden rounded-md border border-neutral-200 bg-neutral-50"
                    >
                        <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            sizes="76px"
                            className="object-contain p-1"
                        />
                    </Link>

                    <div className="min-w-0 flex-1">
                        <p className="mb-1 text-xs text-neutral-500">
                            {product.brand}
                        </p>
                        <Link
                            href={`/product/${product.slug}`}
                            className="line-clamp-2 text-sm font-medium leading-5 text-neutral-900 hover:text-[var(--gearvn-red)]"
                        >
                            {product.name}
                        </Link>
                    </div>
                </div>

                <p className="col-start-1 row-start-2 pl-8 text-sm font-bold text-[var(--gearvn-red)] md:col-start-2 md:row-start-1 md:pl-0">
                    {formatPrice(product.salePrice)}
                </p>

                <div className="col-start-2 row-start-2 justify-self-end md:col-start-3 md:row-start-1 md:justify-self-start">
                    <QuantityControl
                        productId={product.id}
                        quantity={quantity}
                        stockQuantity={product.stockQuantity}
                    />
                </div>

                <button
                    type="button"
                    aria-label={`Xóa ${product.name} khỏi giỏ hàng`}
                    onClick={handleRemove}
                    className="col-start-2 row-start-1 shrink-0 justify-self-end p-1 text-neutral-400 transition hover:text-red-600 md:col-start-4 md:justify-self-start"
                >
                    <FiTrash2 size={17} />
                </button>
            </article>
        );
    }

    return (
        <article className="rounded-lg bg-white p-3 shadow-sm ring-1 ring-gray-100">
            <div className="flex items-center gap-3">
                <Link
                    href={`/product/${product.slug}`}
                    className="relative h-[76px] w-[76px] shrink-0 overflow-hidden rounded-md border border-neutral-200 bg-neutral-50"
                >
                    <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        sizes="76px"
                        className="object-contain p-1"
                    />
                </Link>

                <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-2">
                        <div className="min-w-0 flex-1">
                            <p className="mb-1 text-xs text-neutral-500">
                                {product.brand}
                            </p>

                            <Link
                                href={`/product/${product.slug}`}
                                className="line-clamp-2 text-sm font-medium leading-5 text-neutral-900"
                            >
                                {product.name}
                            </Link>
                        </div>

                        <button
                            type="button"
                            aria-label={`Xóa ${product.name} khỏi giỏ hàng`}
                            onClick={handleRemove}
                            className="shrink-0 p-1 text-neutral-400 transition hover:text-red-600"
                        >
                            <FiTrash2 size={17} />
                        </button>
                    </div>

                    <div className="mt-2 flex items-end justify-between gap-2">
                        <div>
                            <p className="text-sm font-bold text-[var(--gearvn-red)]">
                                {formatPrice(product.salePrice)}
                            </p>

                            <p className="mt-1 text-xs text-neutral-500">
                                Thành tiền:{" "}
                                <span className="font-semibold text-neutral-800">
                                    {formatPrice(totalPrice)}
                                </span>
                            </p>
                        </div>

                        <QuantityControl
                            productId={product.id}
                            quantity={quantity}
                            stockQuantity={product.stockQuantity}
                        />
                    </div>
                </div>
            </div>
        </article>
    );
}
