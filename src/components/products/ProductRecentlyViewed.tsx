"use client";

import { useEffect, useMemo, useState } from "react";
import type { Product } from "@/types/product";
import ProductCarousel from "./ProductCarousel";

const STORAGE_KEY = "gearvn-recently-viewed";
const MAX_ITEMS = 8;

type RecentlyViewedProductsProps = {
  currentProductId: string;
  products: Product[];
};

export default function RecentlyViewedProducts({
  currentProductId,
  products,
}: RecentlyViewedProductsProps) {
  const [recentIds, setRecentIds] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);

    let previousIds: string[] = [];

    try {
      const parsed = saved ? JSON.parse(saved) : [];

      if (Array.isArray(parsed)) {
        previousIds = parsed.filter(
          (id): id is string => typeof id === "string",
        );
      }
    } catch {
      previousIds = [];
    }

    const nextIds = [
      currentProductId,
      ...previousIds.filter((id) => id !== currentProductId),
    ].slice(0, MAX_ITEMS);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextIds));

    setRecentIds(
      nextIds.filter((id) => id !== currentProductId),
    );
  }, [currentProductId]);

  const recentlyViewedProducts = useMemo(() => {
    return recentIds
      .map((id) => products.find((product) => product.id === id))
      .filter((product): product is Product => Boolean(product));
  }, [recentIds, products]);

  if (recentlyViewedProducts.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="recently-viewed-title"
      className="mt-8 rounded-xl bg-white p-5"
    >
      <h2
        id="recently-viewed-title"
        className="mb-4 text-xl font-bold text-neutral-900"
      >
        Sản phẩm đã xem gần đây
      </h2>

      <ProductCarousel
        products={recentlyViewedProducts}
        rows={1}
      />
    </section>
  );
}