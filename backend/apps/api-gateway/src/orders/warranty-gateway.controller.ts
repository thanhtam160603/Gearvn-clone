import { Controller, Get, Param, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ApiBearerAuth, ApiBody, ApiQuery, ApiTags } from '@nestjs/swagger';
import { OrderProxyService } from './order-proxy.service';

@ApiTags('Warranties')
@ApiBearerAuth()
@Controller('warranties')
export class WarrantyGatewayController {
  constructor(private readonly proxy: OrderProxyService) {}
  @Post()
  @ApiBody({ schema: {
    type: 'object', required: ['orderItemId', 'reason'],
    properties: {
      orderItemId: { type: 'string', maxLength: 128 },
      reason: { type: 'string', maxLength: 200 },
      description: { type: 'string', maxLength: 2000 },
    },
  } })
  create(@Req() req: Request, @Res() res: Response) {
    return this.proxy.forward('/warranties', req, res);
  }
  @Get()
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: ['OPEN', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'CLOSED'] })
  list(@Req() req: Request, @Res() res: Response) {
    return this.proxy.forward('/warranties', req, res);
  }
  @Get(':id')
  detail(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
    return this.proxy.forward('/warranties/' + encodeURIComponent(id), req, res);
  }
}
