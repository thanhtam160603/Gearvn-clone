import { products as catalogProducts } from "@/data/products";
import type {
  CollectionConfig,
  CollectionFilterSource,
} from "@/types/collection";
import type {
  Product,
  ProductFilterAttributeKey,
} from "@/types/product";

export type CollectionSort =
  | "default"
  | "price-asc"
  | "price-desc"
  | "name-asc";

export type CollectionFilterState = {
  values: Partial<
    Record<Exclude<CollectionFilterSource, "price">, string[]>
  >;
  priceMin?: number;
  priceMax?: number;
};

export type CollectionFilterOption = {
  value: string;
  label: string;
  count: number;
};

export type CollectionPageResult = {
  items: Product[];
  page: number;
  totalPages: number;
  totalItems: number;
};

export const COLLECTION_PAGE_SIZE = 12;

type AttributeFilterSource = Exclude<CollectionFilterSource, "price" | "brand">;
type ValueFilterSource = Exclude<CollectionFilterSource, "price">;

const FEATURED_SPEC_SOURCE_BY_LABEL: Record<
  string,
  ProductFilterAttributeKey
> = {
  cpu: "cpu",
  ram: "ram",
  ssd: "ssd",
  vga: "vga",

  screen: "screen",
  "màn hình": "screen",

  connection: "connection",
  "kết nối": "connection",

  dpi: "dpi",

  weight: "weight",
  "trọng lượng": "weight",

  layout: "layout",

  backlight: "backlight",

  panel: "panel",

  resolution: "resolution",
  "độ phân giải": "resolution",

  "refresh rate": "refreshRate",
  "tần số quét": "refreshRate",

  mainboard: "mainboard",

  size: "size",
  "kích thước": "size",

  color: "color",
  "màu sắc": "color",

  "case size": "caseSize",
  "kích thước case": "caseSize",

};

function normalizeValue(value: string): string {
  return value.trim();
}

function normalizeValues(values: string[] | undefined): string[] {
  if (!values) return [];

  return values.map(normalizeValue).filter(Boolean);
}

function normalizeComparableValue(value: string): string {
  return value.trim().toLocaleLowerCase("vi");
}

function getProductFilterValues(
  product: Product,
  source: ValueFilterSource,
): string[] {
  if (source === "brand") {
    return normalizeValues([product.brand]);
  }

  const attributeValues = product.filterAttributes?.[
    source as AttributeFilterSource
  ];

  if (attributeValues?.length) {
    return normalizeValues(attributeValues);
  }

  const featuredValues = product.featuredSpecs
    ?.filter((spec) => {
      const mappedSource =
        FEATURED_SPEC_SOURCE_BY_LABEL[spec.label.trim().toLocaleLowerCase("vi")];

      return mappedSource === source;
    })
    .map((spec) => spec.value);

  return normalizeValues(featuredValues);
}

export function getCollectionProducts(
  collection: CollectionConfig,
  allProducts: Product[] = catalogProducts,
): Product[] {
  return allProducts.filter((product) =>
    collection.sections.includes(product.section),
  );
}

export function filterCollectionProducts(
  products: Product[],
  filters: CollectionFilterState,
): Product[] {
  const activeValueFilters = Object.entries(filters.values).flatMap(
    ([source, selectedValues]) => {
      const normalizedSelectedValues = normalizeValues(selectedValues);

      return normalizedSelectedValues.length > 0
        ? [[source as ValueFilterSource, normalizedSelectedValues] as const]
        : [];
    },
  );
  const hasPriceMin = Number.isFinite(filters.priceMin);
  const hasPriceMax = Number.isFinite(filters.priceMax);

  return products.filter((product) => {
    if (hasPriceMin && product.salePrice < filters.priceMin!) return false;
    if (hasPriceMax && product.salePrice > filters.priceMax!) return false;

    return activeValueFilters.every(([source, selectedValues]) => {
      const productValues = getProductFilterValues(product, source);

      return selectedValues.some((selectedValue) =>{
        const normalizedSelectedValue = normalizeComparableValue(selectedValue);
        return productValues.some((productValue) => normalizeComparableValue(productValue) === normalizedSelectedValue)
      }
      );
    });
  });
}

export function sortCollectionProducts(
  products: Product[],
  sort: CollectionSort,
): Product[] {
  const sortedProducts = [...products];

  switch (sort) {
    case "price-asc":
      return sortedProducts.sort((first, second) =>
        first.salePrice - second.salePrice,
      );
    case "price-desc":
      return sortedProducts.sort((first, second) =>
        second.salePrice - first.salePrice,
      );
    case "name-asc":
      return sortedProducts.sort((first, second) =>
        first.name.localeCompare(second.name, "vi"),
      );
    default:
      return sortedProducts;
  }
}

export function paginateCollectionProducts(
  products: Product[],
  page: number,
  pageSize: number,
): CollectionPageResult {
  const totalItems = products.length;

  if (totalItems === 0) {
    return {
      items: [],
      page: 1,
      totalPages: 1,
      totalItems: 0,
    };
  }

  const normalizedPageSize =
    Number.isFinite(pageSize) && pageSize > 0
      ? Math.max(1, Math.floor(pageSize))
      : COLLECTION_PAGE_SIZE;
  const totalPages = Math.ceil(totalItems / normalizedPageSize);
  const requestedPage = Number.isFinite(page) ? Math.floor(page) : 1;
  const currentPage = Math.min(totalPages, Math.max(1, requestedPage));
  const startIndex = (currentPage - 1) * normalizedPageSize;

  return {
    items: products.slice(startIndex, startIndex + normalizedPageSize),
    page: currentPage,
    totalPages,
    totalItems,
  };
}

export function getCollectionFilterOptions(
  products: Product[],
  config: CollectionConfig,
): Record<string, CollectionFilterOption[]> {
  const optionsByFilter: Record<string, CollectionFilterOption[]> = {};

  for (const filter of config.filters) {
    if (filter.type === "price-range" || filter.source === "price") continue;

    const options = new Map<string, CollectionFilterOption>();

    for (const product of products) {
      const productValues = new Set(
        getProductFilterValues(product, filter.source),
      );

      for (const value of productValues) {
        const optionKey = normalizeComparableValue(value);
        const currentOption = options.get(optionKey);

        if (currentOption) {
          currentOption.count += 1;
        } else {
          options.set(optionKey, {
            value,
            label: value,
            count: 1,
          });
        }
      }
    }

    optionsByFilter[filter.id] = [...options.values()];
  }

  return optionsByFilter;
}
