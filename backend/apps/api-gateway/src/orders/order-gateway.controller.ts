import { Controller, Get, Param, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ApiBearerAuth, ApiBody, ApiHeader, ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { OrderProxyService } from './order-proxy.service';

@ApiTags('Orders')
@ApiBearerAuth()
@Controller('orders')
export class OrderGatewayController {
  constructor(private readonly proxy: OrderProxyService) {}
  @Post()
  @ApiOkResponse({ description: 'Đơn hàng đã tạo; nếu đang xử lý có thể trả 409 để retry cùng key' })
  @ApiHeader({ name: 'Idempotency-Key', description: 'Giữ nguyên UUID này khi retry cùng một checkout' })
  @ApiBody({ schema: {
    type: 'object',
    required: ['recipientName', 'phone', 'addressLine', 'ward', 'district', 'city', 'paymentMethod'],
    properties: {
      recipientName: { type: 'string', maxLength: 100 },
      phone: { type: 'string', minLength: 8, maxLength: 20 },
      addressLine: { type: 'string', maxLength: 300 },
      ward: { type: 'string', maxLength: 100 },
      district: { type: 'string', maxLength: 100 },
      city: { type: 'string', maxLength: 100 },
      note: { type: 'string', maxLength: 500 },
      paymentMethod: { type: 'string', enum: ['COD'] },
    },
  } })
  create(@Req() req: Request, @Res() res: Response) {
    return this.proxy.forward('/orders', req, res);
  }
  @Get()
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: ['PLACED', 'CANCELLATION_PENDING', 'SHIPPING', 'DELIVERED', 'CANCELLED'] })
  list(@Req() req: Request, @Res() res: Response) {
    return this.proxy.forward('/orders', req, res);
  }
  @Get(':id')
  detail(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
    return this.proxy.forward('/orders/' + encodeURIComponent(id), req, res);
  }
  @Post(':id/cancel')
  @ApiOkResponse({ description: 'Đơn hàng đã hủy hoặc đang chờ hoàn kho' })
  cancel(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
    return this.proxy.forward('/orders/' + encodeURIComponent(id) + '/cancel', req, res);
  }
}
