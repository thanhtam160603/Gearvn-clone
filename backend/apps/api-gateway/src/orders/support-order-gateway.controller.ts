import { Controller, Param, Patch, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { OrderProxyService } from './order-proxy.service';

@Controller('support')
export class SupportOrderGatewayController {
  constructor(private readonly proxy: OrderProxyService) {}
  @Patch('orders/:id/status')
  orderStatus(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
    return this.proxy.forward('/support/orders/' + encodeURIComponent(id) + '/status', req, res);
  }
  @Patch('warranties/:id/status')
  warrantyStatus(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
    return this.proxy.forward('/support/warranties/' + encodeURIComponent(id) + '/status', req, res);
  }
}