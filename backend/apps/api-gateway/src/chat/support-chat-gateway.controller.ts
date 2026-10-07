import { Controller, Get, Param, Post, Req, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { ChatProxyService } from './chat-proxy.service';

@ApiTags('Support Chat')
@ApiBearerAuth()
@Controller('support/conversations')
export class SupportChatGatewayController {
  constructor(private readonly proxy: ChatProxyService) {}

  @Get()
  list(@Req() req: Request, @Res() res: Response) {
    return this.proxy.forward('/support/conversations', req, res);
  }

  @Post(':id/join')
  join(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
    return this.proxy.forward(
      '/support/conversations/' + encodeURIComponent(id) + '/join',
      req,
      res,
    );
  }

  @Get(':id/messages')
  messages(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
    return this.proxy.forward(
      '/support/conversations/' + encodeURIComponent(id) + '/messages',
      req,
      res,
    );
  }

  @Post(':id/close')
  close(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
    return this.proxy.forward(
      '/support/conversations/' + encodeURIComponent(id) + '/close',
      req,
      res,
    );
  }
}
