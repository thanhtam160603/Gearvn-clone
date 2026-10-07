import { Module } from '@nestjs/common';
import { ChatController } from './chat/chat.controller';
import { ChatService } from './chat/chat.service';
import { SupportChatController } from './chat/support-chat.controller';
import { InternalChatController } from './chat/internal-chat.controller';
import { ServiceConfigModule } from '@app/config/service-config.module';
import { validateChatEnv } from './config/chat-env';
import { ChatAccessGuard } from './chat/chat-access.guard';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from './database/prisma.module';
@Module({
  imports: [
    ServiceConfigModule.forService('chat-service', validateChatEnv),
    JwtModule.register({}),
    PrismaModule,
  ],
  controllers: [ChatController, SupportChatController, InternalChatController],
  providers: [ChatService, ChatAccessGuard],
})
export class ChatServiceModule {}
