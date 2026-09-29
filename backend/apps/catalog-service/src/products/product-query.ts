import { BadRequestException } from '@nestjs/common';
import { attributeKeys, normalize } from '../catalog-data';

export type ProductSort = 
    | 'default' | "price-asc" | "price-desc" | "name-asc";
export type ProductQuery = {
    page: number;
    pageSize: number;
    sort: ProductSort;
    priceMin?: number;
    priceMax?: number;
    values: Record<string, string[]>;
}
export const defaultFilterMap: ReadonlyMap<string, string> = new Map(
    ["brand", ...attributeKeys].map(key => [key, key])
)

export function parseProductQuery(
    raw: Record<string, unknown>,
    filterMap: ReadonlyMap<string, string> = defaultFilterMap,
): ProductQuery {
    const controls = new Set(["page", "pageSize", "sort", "priceMin", "priceMax"]);
    for (const [key, value] of Object.entries(raw)) {
        if (!controls.has(key) && !filterMap.has(key)) {
            throw new BadRequestException(`Invalid query parameter: ${key}`);
        }
        if (typeof value !== "string" || value.length > 2000) {
            throw new BadRequestException(`Invalid query parameter: ${key}`);
        }
    }
    function integer(key: string, fallback?: number): number | undefined {
        const value = raw[key];
            if (value === undefined) return fallback;
            if (typeof value !== "string" || !/^\d+$/.test(value)) {
                throw new BadRequestException(key + " phải là số nguyên không âm");
            }
        const parsed = Number(value);
            if (!Number.isSafeInteger(parsed) || parsed > 2_147_483_647) {
                throw new BadRequestException(key + " vượt giới hạn");
            }
        return parsed;
    }
    const page = integer("page", 1)!;
    const pageSize = integer("pageSize", 12)!;
    if (page < 1 || pageSize < 1 || pageSize > 100) {
        throw new BadRequestException("page >= 1; pageSize trong khoảng 1–100");
    }
    const priceMin = integer("priceMin");
    const priceMax = integer("priceMax");
    if (priceMin !== undefined && priceMax !== undefined && priceMin > priceMax) {
        throw new BadRequestException("priceMin không được lớn hơn priceMax");
    }
    const sort = raw.sort ?? "default";
    const sorts: readonly unknown[] = [
        "default", "price-asc", "price-desc", "name-asc",
    ];
    if (!sorts.includes(sort)) throw new BadRequestException("sort không hợp lệ");

    const selected = new Map<string, Set<string>>();
    for (const [queryKey, source] of filterMap) {
        const value = raw[queryKey];
        if (value === undefined) continue;
        const values = (value as string).split(",").map(normalize).filter(Boolean);
        if (values.length > 20) {
            throw new BadRequestException("Mỗi filter tối đa 20 lựa chọn");
        }
        const existing = selected.get(source) ?? new Set<string>();
        for (const item of values) existing.add(item);
        selected.set(source, existing);
    }
    return {
        page, pageSize, sort: sort as ProductSort, priceMin, priceMax,
        values: Object.fromEntries(
            [...selected].map(([key, values]) => [key, [...values]]),
        ),
    };
}