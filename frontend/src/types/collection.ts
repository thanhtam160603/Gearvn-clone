import type { ProductFilterAttributeKey } from "./product";

export type CollectionFilterSource =
  | "price"
  | "brand"
  | ProductFilterAttributeKey;

export type CollectionFilterConfig = {
  id: string;
  label: string;
  source: CollectionFilterSource;
  type: "checkbox" | "price-range";
};

export type CollectionBanner = {
  src: string;
  alt: string;
};

export type CollectionConfig = {
  slug: string;
  title: string;
  breadcrumbLabel: string;
  description: string;
  filters: CollectionFilterConfig[];
  banner: CollectionBanner | null;
};

export type CollectionSort = "default" | "price-asc" | "price-desc" | "name-asc";

export type CollectionFilterState = {
  values: Partial<Record<Exclude<CollectionFilterSource, "price">, string[]>>;
  priceMin?: number;
  priceMax?: number;
};

export type CollectionFilterOption = {
  value: string;
  label: string;
  count: number;
};
