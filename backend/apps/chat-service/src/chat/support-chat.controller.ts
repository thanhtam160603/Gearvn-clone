import {
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ChatAccessGuard } from './chat-access.guard';
import { ChatService } from './chat.service';
import type { ChatRequest } from './chat-user';
import { ListChatDto } from './dto/list-chat.dto';
import { ListMessagesDto } from './dto/list-messages.dto';

@Controller('support/conversations')
@UseGuards(ChatAccessGuard)
export class SupportChatController {
  constructor(private readonly chats: ChatService) {}

  private supportId(request: ChatRequest): string {
    if (request.user.role !== 'SUPPORT') {
      throw new ForbiddenException('Chỉ nhân viên hỗ trợ được dùng endpoint này');
    }
    return request.user.id;
  }

  @Get()
  list(@Req() request: ChatRequest, @Query() query: ListChatDto) {
    return this.chats.listForSupport(
      this.supportId(request),
      query.cursor,
      query.limit ?? 20,
    );
  }

  @Post(':id/join')
  join(
    @Req() request: ChatRequest,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.chats.claimForSupport(id, this.supportId(request));
  }

  @Post(':id/close')
  close(
    @Req() request: ChatRequest,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.chats.closeForSupport(id, this.supportId(request));
  }

  @Get(':id/messages')
  messages(
    @Req() request: ChatRequest,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Query() query: ListMessagesDto,
  ) {
    this.supportId(request);
    return this.chats.listMessages(id, request.user, query.cursor, query.limit ?? 20);
  }
}
