import { Controller, Get, Param, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { OrderProxyService } from './order-proxy.service';

@Controller('warranties')
export class WarrantyGatewayController {
  constructor(private readonly proxy: OrderProxyService) {}
  @Post()
  create(@Req() req: Request, @Res() res: Response) {
    return this.proxy.forward('/warranties', req, res);
  }
  @Get()
  list(@Req() req: Request, @Res() res: Response) {
    return this.proxy.forward('/warranties', req, res);
  }
  @Get(':id')
  detail(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
    return this.proxy.forward('/warranties/' + encodeURIComponent(id), req, res);
  }
}