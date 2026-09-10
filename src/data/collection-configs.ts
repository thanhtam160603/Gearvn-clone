import type { CollectionConfig } from "@/types/collection";
import { categoryConfigs, getCategoryBySlug } from "@/data/category-configs";

export const collectionConfigs: CollectionConfig[] = categoryConfigs.map(
    ({ slug, title, breadcrumbLabel, description, sections, filters, banner }) => ({
        slug,
        title,
        breadcrumbLabel,
        description,
        sections,
        filters,
        banner,
    }),
);

export { getCategoryBySlug };

export function getCollectionBySlug(slug: string) {
    return collectionConfigs.find((collection) => collection.slug === slug);
}
