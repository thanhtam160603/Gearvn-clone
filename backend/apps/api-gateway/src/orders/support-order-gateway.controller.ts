import { Controller, Param, Patch, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { OrderProxyService } from './order-proxy.service';

@ApiTags('Support')
@ApiBearerAuth()
@Controller('support')
export class SupportOrderGatewayController {
  constructor(private readonly proxy: OrderProxyService) {}
  @Patch('orders/:id/status')
  @ApiBody({ schema: {
    type: 'object', required: ['status'],
    properties: {
      status: { type: 'string', enum: ['SHIPPING', 'DELIVERED'] },
      note: { type: 'string', maxLength: 500 },
    },
  } })
  orderStatus(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
    return this.proxy.forward('/support/orders/' + encodeURIComponent(id) + '/status', req, res);
  }
  @Patch('warranties/:id/status')
  @ApiBody({ schema: {
    type: 'object', required: ['status'],
    properties: {
      status: { type: 'string', enum: ['IN_REVIEW', 'APPROVED', 'REJECTED', 'CLOSED'] },
      note: { type: 'string', maxLength: 2000 },
    },
  } })
  warrantyStatus(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
    return this.proxy.forward('/support/warranties/' + encodeURIComponent(id) + '/status', req, res);
  }
}
