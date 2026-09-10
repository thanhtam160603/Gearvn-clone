import type { CollectionConfig } from "@/types/collection";
import type { CollectionFilterState, CollectionSort } from "./collection";

export type CollectionSearchParams = Record<string, string | string[] | undefined>;

export type CollectionQueryState = {
    filters: CollectionFilterState;
    sort: CollectionSort;
    page: number;
};

function getQueryValue(
    value: string | string[] | undefined,
): string | undefined {
    if (Array.isArray(value)) {
        return value[0];
    }
    return value;
}

function parseList(value: string | string[] | undefined): string[] {
    const rawValue = getQueryValue(value);
    if (!rawValue) {
        return [];
    }
    return [
        ...new Set(
            rawValue
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean),
        ),
    ];
}

function parseNonNegativeNumber(
  value: string | string[] | undefined,
): number | undefined {
  const rawValue = getQueryValue(value)?.trim();

  if (!rawValue) {
    return undefined;
  }

  const parsedValue = Number(rawValue);

  return Number.isFinite(parsedValue) && parsedValue >= 0
    ? parsedValue
    : undefined;
}

export function parseCollectionQuery(
    searchParams: CollectionSearchParams,
    config: CollectionConfig
): CollectionQueryState {

    const rawSort = getQueryValue(searchParams.sort);
    const sort: CollectionSort = 
        rawSort === "price-asc" || 
        rawSort === "price-desc" || 
        rawSort === "name-asc" 
        ? rawSort 
        : "default";

    let priceMin = parseNonNegativeNumber(searchParams.priceMin);
    let priceMax = parseNonNegativeNumber(searchParams.priceMax);
    if (
            priceMin !== undefined &&
            priceMax !== undefined &&
            priceMin > priceMax
        ) {
            priceMin = undefined;
            priceMax = undefined;
    }

    const values: CollectionFilterState["values"] = {};
    for (const filter of config.filters) {
       if (
            filter.type === "price-range" ||
            filter.source === "price"
        ) {
            continue;
        }
        const rawValues = searchParams[filter.id];
        const parsedValues = parseList(rawValues);

        if (parsedValues.length > 0) {
            values[filter.source] = parsedValues;
        }

    }


    const parsePage = Number(getQueryValue(searchParams.page));
    const page = 
         Number.isInteger(parsePage) && parsePage >= 1
         ? parsePage
         : 1;

    return {
        filters: {
            values,
            priceMin,
            priceMax,
        },
        sort,
        page
    };
}

export function buildCollectionQuery(
    state: CollectionQueryState,
    config: CollectionConfig
): string {
    const params = new URLSearchParams();

    if (state.sort !== "default") {
        params.set("sort", state.sort);
    }

    if (state.filters.priceMin !== undefined) {
        params.set("priceMin", String(state.filters.priceMin));
    }

    if (state.filters.priceMax !== undefined) {
        params.set("priceMax", String(state.filters.priceMax));
    }

    for (const filter of config.filters) {
        if (
            filter.type === "price-range" ||
            filter.source === "price"
        ) {
            continue;
        }
        const values = state.filters.values[filter.source];
        if (values && values.length > 0) {
            params.set(filter.id, values.join(","));
        }
    }
    if (state.page > 1) {
        params.set("page", String(state.page));
    }
    const queryString = params.toString();
    return queryString ? `?${queryString}` : "";
}

export function updateCollectionQuery(
    current: URLSearchParams,
    patch: Partial<CollectionQueryState>,
    config: CollectionConfig,
): string {
    const currentState = parseCollectionQuery(
        Object.fromEntries(current.entries()),
        config
    );
    const isFilterOrSortChanged =
        patch.filters !== undefined ||
        patch.sort !== undefined;

    const updatedState: CollectionQueryState = {
        ...currentState,
        ...patch,
        filters: patch.filters ?? currentState.filters,
        page: isFilterOrSortChanged ? 1 : patch.page ?? currentState.page,
    };
    return buildCollectionQuery(updatedState, config);
}
