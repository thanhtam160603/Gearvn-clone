import { Controller, Get } from '@nestjs/common';
import { ChatService } from './chat-service.service';

@Controller()
export class ChatServiceController {
  constructor(private readonly chatServiceService: ChatService) {}

  @Get()
  getHello(): string {
    return this.chatServiceService.getHello();
  }
}
