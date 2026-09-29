import { Body, Controller, HttpCode, Post } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { ProductIdsDto } from "./product-resolve.dto";

@Controller("internal/catalog/products")
export class ProductResolveController {
    constructor(private readonly prisma: PrismaService) {}

    @Post("resolve")
    @HttpCode(200)
    async resolve(@Body() dto: ProductIdsDto) {
        const rows = await this.prisma.product.findMany({
            where: { id: { in: dto.productIds } },
            select: {
                id: true,
                slug: true,
                name: true,
                salePrice: true,
                status: true,
                images: {
                    select: {url: true },
                    orderBy: { position: "asc" },
                    take: 1,
                },
                inventory: {
                    select: { available: true },
                },
            }
        });
        const byId = new Map(rows.map((row) => [row.id, row]));
        return {
            items: dto.productIds.flatMap((id) => {
                const row = byId.get(id);
                return row ? [{
                    id: row.id,
                    slug: row.slug,
                    name: row.name,
                    image: row.images[0]?.url ?? null,
                    salePrice: row.salePrice,
                    available: row.inventory?.available ?? 0,
                    status: row.status,
                }] : [];
            }),
            missingProductIds: dto.productIds.filter((id) => !byId.has(id)),
        }
    }
}