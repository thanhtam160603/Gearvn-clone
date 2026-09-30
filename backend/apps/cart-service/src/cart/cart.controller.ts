import {
Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Req, Res,
} from "@nestjs/common";
import type { Response } from "express";
import type { RequestWithId } from "@app/common";
import { CartOwnerService } from "./cart-owner.service";
import { CartService } from "./cart.service";
import { AddItemDto } from "./dto/add-item.dto";
import { UpdateItemDto } from "./dto/update-item.dto";
import { SelectionDto } from "./dto/selection.dto";

@Controller("cart")
export class CartController {
    constructor(
        private readonly owners: CartOwnerService,
        private readonly carts: CartService,
    ) {}

    @Get()
    async get(@Req() req: RequestWithId, @Res({ passthrough: true }) res: Response) {
        return this.carts.get(await this.owners.resolve(req, res), req.requestId);
    }

    @Post("items")
    @HttpCode(200)
    async add(@Req() req: RequestWithId, @Res({ passthrough: true }) res: Response,
        @Body() dto: AddItemDto) {
        const owner = await this.owners.resolve(req, res);
        return this.carts.add(owner, dto.productId, dto.quantity, req.requestId);
    }

    @Patch("items/:productId")
    async setQuantity(@Req() req: RequestWithId,
        @Res({ passthrough: true }) res: Response,
        @Param("productId") productId: string, @Body() dto: UpdateItemDto) {
        const owner = await this.owners.resolve(req, res);
        return this.carts.setQuantity(owner, productId, dto.quantity, req.requestId);
    }

    @Patch("items/:productId/selection")
    async select(@Req() req: RequestWithId, @Res({ passthrough: true }) res: Response,
        @Param("productId") productId: string, @Body() dto: SelectionDto) {
        return this.carts.select(await this.owners.resolve(req, res), productId, dto.selected);
    }

    @Delete("items/:productId")
    async remove(@Req() req: RequestWithId, @Res({ passthrough: true }) res: Response,
        @Param("productId") productId: string) {
        return this.carts.remove(await this.owners.resolve(req, res), productId);
    }

    @Delete()
    async clear(@Req() req: RequestWithId, @Res({ passthrough: true }) res: Response) {
        return this.carts.clear(await this.owners.resolve(req, res));
    }

    @Post("merge")
    @HttpCode(200)
    async merge(@Req() req: RequestWithId, @Res({ passthrough: true }) res: Response) {
        const user = await this.owners.requiredUser(req);
        const guestId = this.owners.verifiedGuestId(req);
        const result = await this.carts.merge(user, guestId, req.requestId);
        this.owners.clearGuest(res); // chỉ clear sau khi transaction thành công
        return result;
    }
}