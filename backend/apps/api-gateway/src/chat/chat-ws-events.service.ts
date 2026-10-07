import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import WebSocket from 'ws';
import { z } from 'zod';
import { ChatInternalClient, ChatInternalError } from './chat-internal.client';
import { ChatWsSessionService, sendEvent } from './chat-ws-session.service';

const authSchema = z.strictObject({ token: z.string().min(1) });
const joinSchema = z.strictObject({ conversationId: z.uuid() });
const sendSchema = z.strictObject({
  conversationId: z.uuid(),
  clientMessageId: z.uuid(),
  body: z.string().trim().min(1).max(2_000),
});

/** Thực thi giao thức chat JSON mà không phụ thuộc decorator/adapter Nest. */
@Injectable()
export class ChatWsEventsService {
  private readonly logger = new Logger(ChatWsEventsService.name);

  /** Nhận state kết nối và HTTP client đang gọi Chat Service. */
  constructor(
    private readonly sessions: ChatWsSessionService,
    private readonly chat: ChatInternalClient,
  ) {}

  /** Xác thực frame đầu; token sai thì báo lỗi rồi đóng kết nối. */
  async auth(client: WebSocket, raw: unknown): Promise<void> {
    const parsed = authSchema.safeParse(raw);
    if (!parsed.success) {
      sendEvent(client, 'chat.error', { code: 'UNAUTHORIZED', message: 'Access token không hợp lệ' });
      client.close(4401, 'Unauthorized');
      this.sessions.close(client);
      return;
    }
    try {
      await this.sessions.authenticate(client, parsed.data.token);
    } catch {
      sendEvent(client, 'chat.error', { code: 'UNAUTHORIZED', message: 'Access token không hợp lệ' });
      client.close(4401, 'Unauthorized');
      this.sessions.close(client);
    }
  }

  /** Chỉ thêm socket vào hội thoại sau khi Chat Service kiểm quyền thành công. */
  async join(client: WebSocket, raw: unknown): Promise<void> {
    let conversationId: string | undefined;
    try {
      const { token } = this.sessions.requireAuth(client);
      const parsed = joinSchema.safeParse(raw);
      if (!parsed.success) {
        sendEvent(client, 'chat.error', { code: 'INVALID_PAYLOAD', message: 'Conversation ID không hợp lệ' });
        return;
      }
      conversationId = parsed.data.conversationId;
      await this.chat.authorizeJoin(conversationId, token);
      this.sessions.join(client, conversationId);
      sendEvent(client, 'chat.conversation.joined', { conversationId });
    } catch (error) {
      this.reportError(client, error, 'Không thể tham gia hội thoại');
    }
  }

  /** Lưu tin qua Chat Service rồi phát tin mới/ACK theo kết quả idempotency. */
  async send(client: WebSocket, raw: unknown): Promise<void> {
    let clientMessageId: string | undefined;
    try {
      const { token } = this.sessions.requireAuth(client);
      const parsed = sendSchema.safeParse(raw);
      if (!parsed.success) {
        sendEvent(client, 'chat.error', { code: 'INVALID_PAYLOAD', message: 'Tin nhắn không hợp lệ' });
        return;
      }
      const input = parsed.data;
      clientMessageId = input.clientMessageId;
      if (!this.sessions.isJoined(client, input.conversationId)) {
        sendEvent(client, 'chat.error', {
          code: 'ROOM_NOT_JOINED', message: 'Bạn chưa tham gia hội thoại', clientMessageId,
        });
        return;
      }
      const { message, created } = await this.chat.send(input.conversationId, token, {
        clientMessageId, body: input.body,
      });
      if (created) this.sessions.broadcast(input.conversationId, 'chat.message.created', message);
      sendEvent(client, 'chat.message.ack', {
        clientMessageId, messageId: message.id, createdAt: message.createdAt,
      });
    } catch (error) {
      this.reportError(client, error, 'Không gửi được tin nhắn', clientMessageId);
    }
  }

  /** Báo frame JSON sai định dạng mà không để parser ném lỗi ra ngoài socket. */
  invalid(client: WebSocket): void {
    sendEvent(client, 'chat.error', { code: 'INVALID_PAYLOAD', message: 'Dữ liệu WebSocket không hợp lệ' });
  }

  /** Map lỗi internal thành mã an toàn; chỉ lỗi xác thực mới đóng socket. */
  private reportError(client: WebSocket, error: unknown, message: string, clientMessageId?: string): void {
    const status = error instanceof ChatInternalError ? error.status : undefined;
    const unauthorized = error instanceof UnauthorizedException || status === 401;
    const code = unauthorized ? 'UNAUTHORIZED'
      : status === 403 || status === 404 ? 'CONVERSATION_FORBIDDEN'
      : status === 409 ? 'CHAT_CONFLICT'
      : 'CHAT_UNAVAILABLE';
    if (code === 'CHAT_UNAVAILABLE' && !(error instanceof ChatInternalError)) {
      this.logger.error(error);
    }
    sendEvent(client, 'chat.error', { code, message, ...(clientMessageId ? { clientMessageId } : {}) });
    if (unauthorized) {
      client.close(4401, 'Unauthorized');
      this.sessions.close(client);
    }
  }
}
