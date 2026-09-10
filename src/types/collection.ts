import type { ProductFilterAttributeKey, ProductSectionId } from "./product";

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
  sections: ProductSectionId[];
  filters: CollectionFilterConfig[];
  banner?: CollectionBanner;
};
