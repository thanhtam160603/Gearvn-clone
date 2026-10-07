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

type Props = { item: DetailedCartItem; variant?: "drawer" | "page"; onSelectChange?: (selected: boolean) => void };
export default function CartItemRow({ item, variant = "drawer", onSelectChange }: Props) {
  const dispatch = useAppDispatch();
  const name = item.name || item.productId;
  const image = item.image || "/product-placeholder.svg";
  const detail = item.slug ? `/product/${item.slug}` : "#";
  return (
    <article className="flex gap-3 rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-100">
      {variant === "page" && (
        <button type="button" role="checkbox" aria-checked={item.selected} aria-label={`Chọn ${name}`}
          onClick={() => onSelectChange?.(!item.selected)}
          className={`mt-2 flex size-5 shrink-0 items-center justify-center rounded border ${item.selected ? "border-red-600 bg-red-600" : "border-neutral-300"}`}>
          {item.selected && <CheckIcon className="size-3.5 text-white" />}
        </button>
      )}
      <Link href={detail} className="relative size-[76px] shrink-0 overflow-hidden rounded-md border bg-neutral-50">
        <Image src={image} alt={name} fill sizes="76px" className="object-contain p-1" />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <Link href={detail} className="line-clamp-2 text-sm font-medium text-neutral-900 hover:text-red-600">{name}</Link>
          <button type="button" aria-label={`Xóa ${name} khỏi giỏ hàng`} onClick={() => void dispatch(removeItem({ productId: item.productId }))} className="p-1 text-neutral-500 hover:text-red-600"><FiTrash2 size={17} /></button>
        </div>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-sm font-bold text-red-600">{item.salePrice === null ? "Không còn bán" : formatPrice(item.salePrice)}</p>
            <p className="text-xs text-neutral-500">Thành tiền: {formatPrice(item.lineTotal)}</p>
            {!item.canCheckout && <p className="text-xs text-red-600">Sản phẩm hiện không thể thanh toán</p>}
          </div>
          <QuantityControl productId={item.productId} quantity={item.quantity} stockQuantity={item.available} />
        </div>
      </div>
    </article>
  );
}
