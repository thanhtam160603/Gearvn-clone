import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "../generated/prisma/client";
import { PrismaService } from "../database/prisma.service";
import type { ProductQuery } from "./product-query";
import { productInclude, toProductDetail, toProductSummary } from "./product-view";

@Injectable()
export class ProductsService {
    constructor(private readonly prisma: PrismaService) {}

    async list(query: ProductQuery, collectionId?: string) {
        const and: Prisma.ProductWhereInput[] = [];
        if (collectionId) {
            and.push({ collections: { some: { collectionId } } });
        }
        if (query.section) {
            and.push({ section: query.section });
        }
        if (query.priceMin !== undefined || query.priceMax !== undefined) {
            and.push({ salePrice: { gte: query.priceMin, lte: query.priceMax } });
        }
        for (const [source, selected] of Object.entries(query.values)) {
            if (!selected.length) continue;
            and.push(source === "brand"
                ? { brand: { normalizedName: { in: selected } } }
                : { attributes: { some: {
                    key: source, normalizedValue: { in: selected },
            } } });
        }
        const where: Prisma.ProductWhereInput = { AND: and };
        const orderBy: Prisma.ProductOrderByWithRelationInput[] =
            query.sort === "price-asc" ? [{ salePrice: "asc" }, { id: "asc" }] :
            query.sort === "price-desc" ? [{ salePrice: "desc" }, { id: "asc" }] :
            query.sort === "name-asc" ? [{ name: "asc" }, { id: "asc" }] :
            [{ sortOrder: "asc" }, { id: "asc" }];

        return this.prisma.$transaction(async (tx) => {
            const totalItems = await tx.product.count({ where });
            const totalPages = Math.max(1, Math.ceil(totalItems / query.pageSize));
            const page = Math.min(query.page, totalPages);
            const rows = await tx.product.findMany({
                where, orderBy, include: productInclude,
                skip: (page - 1) * query.pageSize, take: query.pageSize,
            });
            return {
                items: rows.map(toProductSummary), totalItems,
                page, pageSize: query.pageSize, totalPages,
            };
            }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
    }
    async detail(slug: string) {
        const product = await this.prisma.product.findUnique({
        where: { slug }, include: productInclude,
        });
        if (!product) throw new NotFoundException("Không tìm thấy sản phẩm");
        return toProductDetail(product);
    }
}
