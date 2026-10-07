import {
  BadRequestException, Body, Controller, Get, Headers, HttpCode, Post, UseGuards,
} from '@nestjs/common';
import { InternalServiceGuard } from '@app/common';
import { CartCheckoutService } from './cart-checkout.service';
import { CartCheckoutCleanupDto } from './dto/cart-checkout.dto';

@Controller('internal/cart')
@UseGuards(InternalServiceGuard)
export class CartCheckoutInternalController {
    constructor(private readonly carts: CartCheckoutService) {}

    @Get('checkout-snapshot')
    snapshot(@Headers('x-user-id') userId: string | undefined) {
        if (typeof userId !== 'string' || !userId.trim() || userId.length > 128) {
        throw new BadRequestException('Invalid internal user ID');
        }
        return this.carts.snapshot(userId);
    }

    @Post('checkout-cleanup')
    @HttpCode(200)
    cleanup(@Body() dto: CartCheckoutCleanupDto) {
        return this.carts.cleanup(dto);
    }
}
