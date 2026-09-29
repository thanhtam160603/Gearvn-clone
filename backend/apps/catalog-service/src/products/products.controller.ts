import { Controller, Get, Param, Query } from "@nestjs/common";
import { parseProductQuery } from "./product-query";
import { ProductsService } from "./products.service";

@Controller("products")
export class ProductsController {
    constructor(private readonly productsService: ProductsService) {}

    @Get()
    list(@Query() query: Record<string, unknown>) {
        return this.productsService.list(parseProductQuery(query));
    }

    @Get(":slug")
    detail(@Param("slug") slug: string) {
        return this.productsService.detail(slug);
    }
}