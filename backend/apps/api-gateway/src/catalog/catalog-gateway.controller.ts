import { Controller, Get, Param, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CatalogProxyService } from "./catalog-proxy.service";

@ApiTags('Catalog')
@Controller()
export class CatalogGatewayController {
    constructor(private readonly catalog: CatalogProxyService) {}

    @Get("products")
    @ApiOperation({ summary: 'Danh sách sản phẩm; filter có thể gồm brand và thuộc tính catalog' })
    @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
    @ApiQuery({ name: 'pageSize', required: false, type: Number, example: 12 })
    @ApiQuery({ name: 'sort', required: false, enum: ['default', 'price-asc', 'price-desc', 'name-asc'] })
    @ApiQuery({ name: 'priceMin', required: false, type: Number })
    @ApiQuery({ name: 'priceMax', required: false, type: Number })
    @ApiQuery({ name: 'brand', required: false, type: String, description: 'Nhiều giá trị ngăn cách bằng dấu phẩy' })
    products(@Req() req: Request, @Res() res: Response) {
        return this.catalog.get("/products", req, res);
    }

    @Get("products/:slug")
    product(
        @Param("slug") slug: string, @Req() req: Request, @Res() res: Response,
    ) {
        return this.catalog.get("/products/" + encodeURIComponent(slug), req, res);
    }

    @Get("categories")
    categories(@Req() req: Request, @Res() res: Response) {
        return this.catalog.get("/categories", req, res);
    }

    @Get("collections/:slug")
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'pageSize', required: false, type: Number })
    collection(
        @Param("slug") slug: string, @Req() req: Request, @Res() res: Response,
    ) {
        return this.catalog.get("/collections/" + encodeURIComponent(slug), req, res);
  }
}
