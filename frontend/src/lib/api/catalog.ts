import { apiClient } from "./client";
import type { Product, ProductSummary } from "@/types/product";
import type { CollectionConfig, CollectionFilterOption } from "@/types/collection";

export type CatalogCategory = { id: string; slug: string; title: string };
export type ProductPage = {
  items: ProductSummary[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};
export type CollectionPage = ProductPage & {
  collection: CollectionConfig;
  filterOptions: Record<string, CollectionFilterOption[]>;
};

function queryString(values: Record<string, string | number | undefined>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

export async function listProducts(values: {
  section?: string;
  page?: number;
  pageSize?: number;
  sort?: string;
} = {}): Promise<ProductPage> {
  const { data } = await apiClient.get<ProductPage>(`/api/products${queryString(values)}`);
  return data;
}

export async function getProduct(slug: string): Promise<Product> {
  const { data: product } = await apiClient.get<Product>(`/api/products/${encodeURIComponent(slug)}`);
  return { ...product, images: product.images.length ? product.images : [product.image || "/product-placeholder.svg"] };
}

export async function getCategories(): Promise<CatalogCategory[]> {
  const { data } = await apiClient.get<CatalogCategory[]>("/api/categories");
  return data;
}

export async function getCollection(
  slug: string,
  query = "",
): Promise<CollectionPage> {
  const safeQuery = query.startsWith("?") ? query : query ? `?${query}` : "";
  const { data } = await apiClient.get<CollectionPage>(`/api/collections/${encodeURIComponent(slug)}${safeQuery}`);
  return data;
}
