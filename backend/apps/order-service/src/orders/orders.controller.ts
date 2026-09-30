import {
  ConflictException, Controller, Get, HttpCode, Param, Post, Query, Req, Res, UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { OrderAccessGuard } from '../auth/order-access.guard';
import { CustomerRoleGuard } from '../auth/customer-role.guard';
import type { OrderRequest } from '../auth/order-user';
import { ListOrdersDto } from './dto/list-orders.dto';
import { OrdersService } from './orders.service';
import { OrderCancellationService } from './order-cancellation.service';

@Controller('orders')
@UseGuards(OrderAccessGuard, CustomerRoleGuard)
export class OrdersController {
    constructor(
        private readonly orders: OrdersService,
        private readonly cancellations: OrderCancellationService,
    ) {}
    @Get()
    list(@Req() req: OrderRequest, @Query() query: ListOrdersDto) {
        return this.orders.list(req.user.id, query);
    }
    @Get(':id')
    detail(@Req() req: OrderRequest, @Param('id') id: string) {
        return this.orders.detail(req.user.id, id);
    }
    @Post(':id/cancel') @HttpCode(200)
    async cancel(@Req() req: OrderRequest, @Param('id') id: string,
        @Res({ passthrough: true }) res: Response) {
        const result = await this.cancellations.cancel(req.user.id, id, req.requestId);
        if (result) return result;
        res.setHeader('Retry-After', '2');
        throw new ConflictException({
        code: 'CANCELLATION_IN_PROGRESS', message: 'Đang hoàn kho để hủy đơn',
        });
    }
}