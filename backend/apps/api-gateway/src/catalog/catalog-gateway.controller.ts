import { Controller, Get, Param, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";
import { CatalogProxyService } from "./catalog-proxy.service";

@Controller()
export class CatalogGatewayController {
    constructor(private readonly catalog: CatalogProxyService) {}

    @Get("products")
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
    collection(
        @Param("slug") slug: string, @Req() req: Request, @Res() res: Response,
    ) {
        return this.catalog.get("/collections/" + encodeURIComponent(slug), req, res);
  }
}