"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { Product } from "@/types/product";
import { formatPrice } from "@/lib/format-price";

type StickyProductBarProps = {
  product: Product;
};

export default function StickyProductBar({ product }: StickyProductBarProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const visible = window.scrollY > 80;

      setIsVisible(visible);
      window.dispatchEvent(
        new CustomEvent("sticky-product-bar-visibility", {
          detail: { visible },
        }),
      );
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.dispatchEvent(
        new CustomEvent("sticky-product-bar-visibility", {
          detail: { visible: false },
        }),
      );
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] border-t border-neutral-200 bg-white/95 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] backdrop-blur md:bottom-auto md:top-0 md:border-b md:border-t-0 md:shadow-[0_4px_16px_rgba(0,0,0,0.08)]">
      <div className="container-shell flex min-h-20 items-center gap-3 py-2 sm:gap-4">
        <div className="relative hidden size-14 shrink-0 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50 sm:block">
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            sizes="56px"
            className="object-contain"
          />
        </div>

        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm font-semibold text-neutral-900">
            {product.name}
          </p>
          <p className="mt-1 text-base font-bold text-[var(--gearvn-red)]">
            {formatPrice(product.salePrice)}
          </p>
        </div>

        <button
          type="button"
          className="hidden rounded-lg border border-[var(--gearvn-red)] px-4 py-2 text-sm font-semibold text-[var(--gearvn-red)] transition hover:bg-red-50 sm:block"
        >
          Tư vấn ngay
        </button>
        <button
          type="button"
          className="rounded-lg bg-[var(--gearvn-red)] px-4 py-2 text-sm font-bold text-white transition hover:brightness-95"
        >
          Mua ngay
        </button>
      </div>
    </div>
  );
}
