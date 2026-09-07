"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
    ChevronLeftIcon,
    ChevronRightIcon,
} from "@heroicons/react/24/solid";
import type { Product } from "@/types/product";
import ProductCard from "./ProductCard";

type ProductCarouselProps = {
    products: Product[];
    rows?: 1 | 2;
};

export default function ProductCarousel({
  products,
  rows = 1,
}: ProductCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const maxScrollLeft = container.scrollWidth - container.clientWidth;
    setCanScrollLeft(container.scrollLeft > 4);
    setCanScrollRight(container.scrollLeft < maxScrollLeft - 4);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.scrollLeft = 0;
    updateScrollState();
    container.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);

    return () => {
      container.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [products, rows, updateScrollState]);

  const scroll = (direction: "left" | "right") => {
    const container = containerRef.current;
    if (!container) return;

    container.scrollBy({
      left: direction === "left" ? -container.clientWidth : container.clientWidth,
      behavior: "smooth",
    });
  };

  if (products.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-gray-500">
        Chưa có sản phẩm trong danh mục này.
      </p>
    );
  }

  return (
    <div className="group/carousel relative">
      <div
        ref={containerRef}
        role="list"
        aria-label="Danh sách sản phẩm"
        className="grid auto-cols-[46%] grid-flow-col gap-3 overflow-x-auto scroll-smooth [scrollbar-width:none] sm:auto-cols-[32%] lg:auto-cols-[calc((100%-48px)/5)]"
        style={{ gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))` }}
      >
        {products.map((product) => (
          <div key={product.id} role="listitem" className="min-w-0 snap-start">
            <ProductCard product={product} />
          </div>
        ))}
      </div>

      <button
        type="button"
        aria-label="Xem sản phẩm trước"
        disabled={!canScrollLeft}
        onClick={() => scroll("left")}
        className="absolute left-0 top-1/2 hidden h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-md transition hover:text-[var(--gearvn-red)] disabled:pointer-events-none disabled:opacity-0 lg:flex"
      >
        <ChevronLeftIcon className="h-5 w-5" />
      </button>
      <button
        type="button"
        aria-label="Xem sản phẩm tiếp theo"
        disabled={!canScrollRight}
        onClick={() => scroll("right")}
        className="absolute right-0 top-1/2 hidden h-10 w-10 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-md transition hover:text-[var(--gearvn-red)] disabled:pointer-events-none disabled:opacity-0 lg:flex"
      >
        <ChevronRightIcon className="h-5 w-5" />
      </button>
    </div>
  );
}
