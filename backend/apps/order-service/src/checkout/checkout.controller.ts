import {
  Body, ConflictException, Controller, Headers, HttpCode, Post, Req, Res, UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { OrderAccessGuard } from '../auth/order-access.guard';
import { CustomerRoleGuard } from '../auth/customer-role.guard';
import type { OrderRequest } from '../auth/order-user';
import { CheckoutDto } from './dto/checkout.dto';
import { CheckoutService } from './checkout.service';

@Controller('orders')
@UseGuards(OrderAccessGuard, CustomerRoleGuard)
export class CheckoutController {
    constructor(private readonly checkoutService: CheckoutService) {}

    @Post()
    @HttpCode(200)
    async checkout(
        @Req() req: OrderRequest,
        @Headers('idempotency-key') key: string | undefined,
        @Body() dto: CheckoutDto,
        @Res({ passthrough: true }) res: Response,
    ) {
        const result = await this.checkoutService.checkout(req.user.id, key, dto, req.requestId);
        if (result.kind === 'completed') return result.order;
        res.setHeader('Retry-After', '2');
        throw new ConflictException({
            code: 'CHECKOUT_IN_PROGRESS', message: 'Checkout đang xử lý; thử lại sau',
            details: [{ checkoutRequestId: result.checkoutRequestId }],
        });
    }
}