import { Controller, Delete, Get, Param, Patch, Post, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CartProxyService } from "./cart-proxy.service";

@ApiTags('Cart')
// Bearer có thể bỏ trống cho giỏ guest; riêng /merge bắt buộc đăng nhập.
@ApiBearerAuth()
@Controller("cart")
export class CartGatewayController {
    constructor(private readonly proxy: CartProxyService) {}

    @Get()
    @ApiOperation({ summary: 'Lấy giỏ hàng (Bearer tùy chọn cho user, không có token là guest)' })
    get(@Req() req: Request, @Res() res: Response): Promise<void> {
        return this.proxy.forward("/cart", req, res);
    }

    @Post("items")
    @ApiOperation({ summary: 'Thêm sản phẩm vào giỏ (guest hoặc user)' })
    @ApiOkResponse({ description: 'Giỏ sau khi thêm sản phẩm' })
    @ApiBody({ schema: {
      type: 'object', required: ['productId', 'quantity'],
      properties: {
        productId: { type: 'string', maxLength: 128 },
        quantity: { type: 'integer', minimum: 1, maximum: 99 },
      },
    } })
    add(@Req() req: Request, @Res() res: Response): Promise<void> {
        return this.proxy.forward("/cart/items", req, res);
    }

    @Patch("items/:productId")
    @ApiBody({ schema: {
      type: 'object', required: ['quantity'],
      properties: { quantity: { type: 'integer', minimum: 1, maximum: 99 } },
    } })
    quantity(@Param("productId") id: string, @Req() req: Request, @Res() res: Response): Promise<void> {
        return this.proxy.forward(`/cart/items/${encodeURIComponent(id)}`, req, res);
    }

    @Patch("items/:productId/selection")
    @ApiBody({ schema: {
      type: 'object', required: ['selected'],
      properties: { selected: { type: 'boolean' } },
    } })
    selection(@Param("productId") id: string, @Req() req: Request, @Res() res: Response): Promise<void> {
        return this.proxy.forward(`/cart/items/${encodeURIComponent(id)}/selection`, req, res);
    }

    @Delete("items/:productId")
    remove(@Param("productId") id: string, @Req() req: Request, @Res() res: Response): Promise<void> {
        return this.proxy.forward(`/cart/items/${encodeURIComponent(id)}`, req, res);
    }

    @Post("merge")
    @ApiOperation({ summary: 'Gộp giỏ guest vào tài khoản sau đăng nhập (cần Bearer token)' })
    @ApiOkResponse({ description: 'Giỏ sau khi gộp' })
    merge(@Req() req: Request, @Res() res: Response): Promise<void> {
        return this.proxy.forward("/cart/merge", req, res);
    }

    @Delete()
    clear(@Req() req: Request, @Res() res: Response): Promise<void> {
        return this.proxy.forward("/cart", req, res);
    }
}
