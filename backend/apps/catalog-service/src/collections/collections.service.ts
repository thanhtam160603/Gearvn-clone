import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { filterDefinitionsSchema, normalize } from "../catalog-data";
import { parseProductQuery } from "../products/product-query";
import { ProductsService } from "../products/products.service";

@Injectable()
export class CollectionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly productsService: ProductsService,
  ) {}

  async detail(slug: string, raw: 
    Record<string, unknown>) {
        const collection = await this.prisma.collection.findUnique({
             where: { slug},
            }
        );
        if (!collection) throw new NotFoundException("Không tìm thấy bộ sưu tập");
        const definitions= filterDefinitionsSchema.parse(collection.filterDefinitions);
        const filters = new Map(
            definitions.filter((f) => f.type === "checkbox" && f.source !== "price").map((f) => [f.id, f.source]),
        )
        const query =parseProductQuery(raw, filters);
        const page = await this.productsService.list(query, collection.id);
        const baseProducts = await this.prisma.product.findMany({
            where: { collections: { some: { collectionId: collection.id } } },
            include: { brand: true, attributes: true },
        })
        const filterOptions: Record<string, {
            value: string, label: string, count: number }[]> = {};

        for (const definition of definitions) {
            if (definition.type !== "checkbox" || definition.source === "price") continue;
            const options = new Map<string, {value: string, label: string, count: number }>();
            for (const product of baseProducts) {
                const values = definition.source === "brand"
                    ? [product.brand.name]
                    : product.attributes.filter((a) => a.key === definition.source)?.map((a) => a.value);
                const seen = new Set<string>();
                for (const label of values) {
                    const value = normalize(label);
                    if (!value || seen.has(value)) continue;
                    seen.add(value);
                    const option = options.get(value) ?? {value, label, count: 0 };
                    option.count += 1;
                    options.set(value, option);
                }
            }
            filterOptions[definition.id] = [...options.values()].sort((a, b) => a.label.localeCompare(b.label, "vi"),);
        }
        return {
            collection: {
                id: collection.id,
                slug: collection.slug,
                title: collection.title,
                breadcrumbLabel: collection.breadcrumbLabel,
                description: collection.description,
                filters: definitions,
                banner: collection.bannerSrc ? {
                    src: collection.bannerSrc,
                    alt: collection.bannerAlt ?? "",
                } : null,
            },
            ...page,
            filterOptions,
        }
    }
}