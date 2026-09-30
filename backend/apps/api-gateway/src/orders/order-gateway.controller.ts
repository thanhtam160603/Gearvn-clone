import { Controller, Get, Param, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { OrderProxyService } from './order-proxy.service';

@Controller('orders')
export class OrderGatewayController {
  constructor(private readonly proxy: OrderProxyService) {}
  @Post()
  create(@Req() req: Request, @Res() res: Response) {
    return this.proxy.forward('/orders', req, res);
  }
  @Get()
  list(@Req() req: Request, @Res() res: Response) {
    return this.proxy.forward('/orders', req, res);
  }
  @Get(':id')
  detail(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
    return this.proxy.forward('/orders/' + encodeURIComponent(id), req, res);
  }
  @Post(':id/cancel')
  cancel(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
    return this.proxy.forward('/orders/' + encodeURIComponent(id) + '/cancel', req, res);
  }
}