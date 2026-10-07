import { Module } from '@nestjs/common';
import { ChatGatewayController } from './chat-gateway.controller';
import { SupportChatGatewayController } from './support-chat-gateway.controller';
import { ChatProxyService } from './chat-proxy.service';
import { JwtModule } from '@nestjs/jwt';
import { ChatSocketAuthService } from './chat-socket-auth.service';
import { ChatInternalClient } from './chat-internal.client';
import { ChatSocketGateway } from './chat-socket.gateway';
import { ChatWsSessionService } from './chat-ws-session.service';
import { ChatWsEventsService } from './chat-ws-events.service';

@Module({
  imports: [JwtModule.register({})],
  controllers: [ChatGatewayController, SupportChatGatewayController],
  providers: [
    ChatProxyService,
    ChatSocketAuthService,
    ChatInternalClient,
    ChatWsSessionService,
    ChatWsEventsService,
    ChatSocketGateway,
  ],
})
export class ChatGatewayModule {}
