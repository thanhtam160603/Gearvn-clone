import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { OrderAccessGuard } from '../auth/order-access.guard';
import { CustomerRoleGuard } from '../auth/customer-role.guard';
import type { OrderRequest } from '../auth/order-user';
import { WarrantyService } from './warranty.service';
import { CreateWarrantyDto } from './dto/create-warranty.dto';
import { ListWarrantiesDto } from './dto/list-warranties.dto';

@Controller('warranties')
@UseGuards(OrderAccessGuard, CustomerRoleGuard)
export class WarrantyController {
    constructor(private readonly warranties: WarrantyService) {}
    @Post()
    create(@Req() req: OrderRequest, @Body() dto: CreateWarrantyDto) {
        return this.warranties.create(req.user.id, dto);
    }
    @Get()
    list(@Req() req: OrderRequest, @Query() query: ListWarrantiesDto) {
        return this.warranties.list(req.user.id, query);
    }
    @Get(':id')
    detail(@Req() req: OrderRequest, @Param('id') id: string) {
        return this.warranties.detail(req.user.id, id);
    }
}