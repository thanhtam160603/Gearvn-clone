import {
  Controller, ForbiddenException, Get, Param, ParseUUIDPipe, Post, Query, Req, UseGuards,
} from '@nestjs/common';
import { ChatAccessGuard } from './chat-access.guard';
import type { ChatRequest } from './chat-user';
import { ChatService } from './chat.service';
import { ListMessagesDto } from './dto/list-messages.dto';

@Controller('chat/conversations')
@UseGuards(ChatAccessGuard)
export class ChatController {
    constructor(private readonly chats: ChatService) {}

    private customerId(request: ChatRequest): string {
        if (request.user.role !== 'CUSTOMER') {
        throw new ForbiddenException('Chỉ khách hàng được dùng endpoint này');
        }
        return request.user.id;
    }

    @Post()
    create(@Req() request: ChatRequest) {
        return this.chats.getOrCreateCurrent(this.customerId(request));
    }

    @Get('current')
    current(@Req() request: ChatRequest) {
        return this.chats.getCurrent(this.customerId(request));
    }

    @Get(':id/messages')
    messages(
      @Req() request: ChatRequest,
      @Param('id', new ParseUUIDPipe()) id: string,
      @Query() query: ListMessagesDto,
    ) {
      this.customerId(request);
      return this.chats.listMessages(id, request.user, query.cursor, query.limit ?? 20);
    }
}
