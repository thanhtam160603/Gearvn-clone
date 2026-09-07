"use client";
import Image from "next/image";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";
import { useAppSelector } from "@/hooks/redux-hooks";
import { selectCartTotalQuantity, selectDetailedCartItems } from "@/store/cart-selectors";

import {formatPrice} from "@/lib/format-price";
import { useState } from "react";

export default function ShippingOrderProducts() {
    const items = useAppSelector(selectDetailedCartItems);
    const totalQuantity = useAppSelector(selectCartTotalQuantity);

    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <section className="rounded-lg bg-white p-4">
            <button
                type="button"
                aria-expanded={isExpanded}
                onClick={() => setIsExpanded((value) => !value)}
                className="flex w-full items-center justify-between text-left"
                >
                    <span className="font-semibold text-neutral-800">
                        Sản phẩm trong đơn ({totalQuantity})
                    </span>
                    {isExpanded ? (<FiChevronUp size={20} />) : (<FiChevronDown size={20} />)}
            </button>
            {isExpanded && (
                <div className="mt-4 divide-y divide-neutral-200">
                    {items.map((item) => (
                        <div key={item.productId} className="flex items-center gap-4">
                            <div className="relative size-14 shrink-0 overflow-hidden rounded border border-neutral-200 bg-neutral-50">
                                <Image
                                    src={item.product.image}
                                    alt={item.product.name}
                                    sizes="56px"
                                    fill
                                    className="h-full w-full object-cover"
                                />
                                </div>
                                <p className="min-w-0 flex-1 text-sm text-neutral-800">
                                    {item.product.name}
                                </p>
                                <span className="shrink-0 text-sm text-neutral-500">
                                    x{item.quantity}
                                </span>
                                <strong className="shrink-0 text-base font-semibold text-[var(--gearvn-red)]">
                                    {formatPrice(item.totalPrice)}
                                </strong>
                            
                        </div>
                    ))}
                </div>
            )
            
            }
        </section>
    )
}