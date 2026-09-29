import { Prisma } from "../generated/prisma/client";
import {
    bundlesSchema, contentSchema, stringsSchema, variantsSchema,
} from "../catalog-data";

export const productInclude = {
    brand: true,
    images: { orderBy: { position: "asc" } },
    specs: { orderBy: [{ groupPosition: "asc" }, { position: "asc" }] },
    attributes: true,
    inventory: true,
} satisfies Prisma.ProductInclude;
type ProductRow = Prisma.ProductGetPayload<{ include: typeof productInclude }>;

export function toProductSummary(product: ProductRow) {
    const available = product.inventory?.available ?? 0;
    return {
        id: product.id, sku: product.sku, slug: product.slug,
        name: product.name, section: product.section, brand: product.brand.name,
        image: product.images[0]?.url ?? "",
        salePrice: product.salePrice,
        originalPrice: product.originalPrice ?? undefined,
        discount: product.originalPrice && product.originalPrice > product.salePrice
        ? Math.round((1 - product.salePrice / product.originalPrice) * 100) : 0,
        stockQuantity: available,
        status: available === 0 && product.status !== "pre-order"
        ? "out-of-stock" : product.status,
        tags: stringsSchema.parse(product.tags),
        highlights: stringsSchema.parse(product.highlights),
        featuredSpecs: product.specs.filter((s) => s.featured).map((s) => ({
        label: s.label, value: s.value,
        })),
        warranty: product.warranty ?? undefined,
        promotion: product.promotion ?? undefined,
        rating: product.rating ?? undefined, reviewCount: product.reviewCount,
    };
}
export function toProductDetail(product: ProductRow) {
    const groups = new Map<number, {
        title: string; items: { label: string; value: string }[];
    }>();
    for (const spec of product.specs.filter((s) => !s.featured)) {
        const group = groups.get(spec.groupPosition) ?? {
        title: spec.groupTitle, items: [],
        };
        group.items.push({ label: spec.label, value: spec.value });
        groups.set(spec.groupPosition, group);
    }
    const attributes = new Map<string, string[]>();
    for (const attr of product.attributes) {
        attributes.set(attr.key, [...(attributes.get(attr.key) ?? []), attr.value]);
    }
    return {
        ...toProductSummary(product),
        images: product.images.map((image) => image.url),
        shortDescription: product.shortDescription ?? undefined,
        description: product.description ?? undefined,
        specificationGroups: [...groups.values()],
        filterAttributes: Object.fromEntries(attributes),
        variants: variantsSchema.parse(product.variants),
        bundles: bundlesSchema.parse(product.bundles),
        contentSections: contentSchema.parse(product.contentSections),
    };
}