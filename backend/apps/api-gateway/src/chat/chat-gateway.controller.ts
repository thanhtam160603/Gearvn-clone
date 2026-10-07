import { Controller, Get, Param, Post, Req, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { ChatProxyService } from './chat-proxy.service';

@ApiTags('Chat')
@ApiBearerAuth()
@Controller('chat/conversations')
export class ChatGatewayController {
  constructor(private readonly proxy: ChatProxyService) {}

  @Post()
  create(@Req() req: Request, @Res() res: Response) {
    return this.proxy.forward('/chat/conversations', req, res);
  }

  @Get('current')
  current(@Req() req: Request, @Res() res: Response) {
    return this.proxy.forward('/chat/conversations/current', req, res);
  }

  @Get(':id/messages')
  messages(
    @Param('id') id: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    return this.proxy.forward(
      '/chat/conversations/' + encodeURIComponent(id) + '/messages',
      req,
      res,
    );
  }
}
