import { Body, Controller, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { OrderAccessGuard } from '../auth/order-access.guard';
import { SupportRoleGuard } from '../auth/support-role.guard';
import type { OrderRequest } from '../auth/order-user';
import { OrderStatusService } from './order-status.service';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@Controller('support/orders')
@UseGuards(OrderAccessGuard, SupportRoleGuard)
export class SupportOrdersController {
    constructor(private readonly statuses: OrderStatusService) {}
    @Patch(':id/status')
    change(@Req() req: OrderRequest, @Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
        return this.statuses.change(req.user.id, id, dto);
    }
}