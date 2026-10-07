import { createHash, timingSafeEqual } from 'node:crypto';
import {
  Body,
  Controller,
  ForbiddenException,
  Headers,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ChatEnv } from '../config/chat-env';
import { ChatAccessGuard } from './chat-access.guard';
import { ChatService } from './chat.service';
import type { ChatRequest } from './chat-user';
import { SendMessageDto } from './dto/send-message.dto';

@Controller('internal/chat/conversations')
@UseGuards(ChatAccessGuard)
export class InternalChatController {
  constructor(
    private readonly chats: ChatService,
    private readonly config: ConfigService<ChatEnv, true>,
  ) {}

  private requireInternalKey(header: string | undefined): void {
    if (!header) throw new ForbiddenException('Internal access required');
    const expected = createHash('sha256')
      .update(this.config.get('INTERNAL_SERVICE_KEY', { infer: true }))
      .digest();
    const received = createHash('sha256').update(header).digest();
    if (!timingSafeEqual(expected, received)) {
      throw new ForbiddenException('Internal access required');
    }
  }

  @Post(':id/authorize-join')
  authorizeJoin(
    @Headers('x-internal-service-key') key: string | undefined,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() request: ChatRequest,
  ) {
    this.requireInternalKey(key);
    return this.chats.authorizeJoin(id, request.user);
  }

  @Post(':id/messages')
  send(
    @Headers('x-internal-service-key') key: string | undefined,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: SendMessageDto,
    @Req() request: ChatRequest,
  ) {
    this.requireInternalKey(key);
    return this.chats.saveMessage(
      id,
      request.user,
      dto.clientMessageId,
      dto.body,
    );
  }
}
