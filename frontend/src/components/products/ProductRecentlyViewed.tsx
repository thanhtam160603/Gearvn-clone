"use client";
import { useEffect, useMemo, useSyncExternalStore } from "react";
import type { ProductSummary } from "@/types/product";
import ProductCarousel from "./ProductCarousel";

const STORAGE_KEY = "gearvn-recently-viewed";
const EVENT = "gearvn-recently-viewed-change";
const MAX_ITEMS = 8;
function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(EVENT, callback);
  return () => { window.removeEventListener("storage", callback); window.removeEventListener(EVENT, callback); };
}
const getSnapshot = () => localStorage.getItem(STORAGE_KEY) ?? "[]";
const getServerSnapshot = () => "[]";
function parseIds(raw: string): string[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch { return []; }
}
export default function RecentlyViewedProducts({ currentProductId, products }: { currentProductId: string; products: ProductSummary[] }) {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const ids = useMemo(() => parseIds(raw), [raw]);
  useEffect(() => {
    const previous = parseIds(getSnapshot());
    const next = [currentProductId, ...previous.filter((id) => id !== currentProductId)].slice(0, MAX_ITEMS);
    const serialized = JSON.stringify(next);
    if (serialized !== getSnapshot()) {
      localStorage.setItem(STORAGE_KEY, serialized);
      window.dispatchEvent(new Event(EVENT));
    }
  }, [currentProductId]);
  const recent = ids.filter((id) => id !== currentProductId)
    .map((id) => products.find((product) => product.id === id))
    .filter((product): product is ProductSummary => Boolean(product));
  if (!recent.length) return null;
  return <section aria-labelledby="recently-viewed-title" className="mt-8 rounded-xl bg-white p-5">
    <h2 id="recently-viewed-title" className="mb-4 text-xl font-bold">Sản phẩm đã xem gần đây</h2>
    <ProductCarousel products={recent} rows={1} />
  </section>;
}
