import { Body, Controller, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { OrderAccessGuard } from '../auth/order-access.guard';
import { SupportRoleGuard } from '../auth/support-role.guard';
import type { OrderRequest } from '../auth/order-user';
import { WarrantyService } from './warranty.service';
import { UpdateWarrantyStatusDto } from './dto/update-warranty-status.dto';

@Controller('support/warranties')
@UseGuards(OrderAccessGuard, SupportRoleGuard)
export class SupportWarrantyController {
  constructor(private readonly warranties: WarrantyService) {}
  @Patch(':id/status')
  change(@Req() req: OrderRequest, @Param('id') id: string, @Body() dto: UpdateWarrantyStatusDto) {
    return this.warranties.change(req.user.id, id, dto);
  }
}