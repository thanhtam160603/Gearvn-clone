import { SkipThrottle } from '@nestjs/throttler';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import type WebSocket from 'ws';
import { ChatWsEventsService } from './chat-ws-events.service';
import { ChatWsSessionService } from './chat-ws-session.service';

/** Public WebSocket endpoint /chat; nghiệp vụ tin nhắn vẫn ở Chat Service. */
@WebSocketGateway({ path: '/chat' })
@SkipThrottle()
export class ChatSocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  /** Nhận các service quản lý phiên WS và xử lý event JSON. */
  constructor(
    private readonly sessions: ChatWsSessionService,
    private readonly events: ChatWsEventsService,
  ) {}

  /** Bắt đầu timeout xác thực ngay khi HTTP upgrade thành công. */
  handleConnection(client: WebSocket): void {
    this.sessions.open(client);
  }

  /** Dọn membership/timer để không phát tin cho socket đã đóng. */
  handleDisconnect(client: WebSocket): void {
    this.sessions.close(client);
  }

  /** Nhận access token ở frame đầu tiên của WebSocket thuần. */
  @SubscribeMessage('chat.auth')
  async auth(@ConnectedSocket() client: WebSocket, @MessageBody() data: unknown): Promise<void> {
    await this.events.auth(client, data);
  }

  /** Xin tham gia hội thoại sau khi JWT và quyền ở Chat Service đã được kiểm. */
  @SubscribeMessage('chat.conversation.join')
  async join(@ConnectedSocket() client: WebSocket, @MessageBody() data: unknown): Promise<void> {
    await this.events.join(client, data);
  }

  /** Lưu tin qua Chat Service rồi phát event/ACK theo kết quả lưu. */
  @SubscribeMessage('chat.message.send')
  async send(@ConnectedSocket() client: WebSocket, @MessageBody() data: unknown): Promise<void> {
    await this.events.send(client, data);
  }

  /** Trả lỗi an toàn cho JSON frame không đúng contract. */
  @SubscribeMessage('chat.invalid')
  invalid(@ConnectedSocket() client: WebSocket): void {
    this.events.invalid(client);
  }
}
