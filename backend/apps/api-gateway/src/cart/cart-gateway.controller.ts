import { Controller, Delete, Get, Param, Patch, Post, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";
import { CartProxyService } from "./cart-proxy.service";

@Controller("cart")
export class CartGatewayController {
    constructor(private readonly proxy: CartProxyService) {}

    @Get()
    get(@Req() req: Request, @Res() res: Response): Promise<void> {
        return this.proxy.forward("/cart", req, res);
    }

    @Post("items")
    add(@Req() req: Request, @Res() res: Response): Promise<void> {
        return this.proxy.forward("/cart/items", req, res);
    }

    @Patch("items/:productId")
    quantity(@Param("productId") id: string, @Req() req: Request, @Res() res: Response): Promise<void> {
        return this.proxy.forward(`/cart/items/${encodeURIComponent(id)}`, req, res);
    }

    @Patch("items/:productId/selection")
    selection(@Param("productId") id: string, @Req() req: Request, @Res() res: Response): Promise<void> {
        return this.proxy.forward(`/cart/items/${encodeURIComponent(id)}/selection`, req, res);
    }

    @Delete("items/:productId")
    remove(@Param("productId") id: string, @Req() req: Request, @Res() res: Response): Promise<void> {
        return this.proxy.forward(`/cart/items/${encodeURIComponent(id)}`, req, res);
    }

    @Post("merge")
    merge(@Req() req: Request, @Res() res: Response): Promise<void> {
        return this.proxy.forward("/cart/merge", req, res);
    }

    @Delete()
    clear(@Req() req: Request, @Res() res: Response): Promise<void> {
        return this.proxy.forward("/cart", req, res);
    }
}