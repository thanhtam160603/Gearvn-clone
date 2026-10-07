import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import WebSocket from 'ws';
import { ChatSocketAuthService, type ChatSocketUser } from './chat-socket-auth.service';

type Session = {
  token?: string;
  user?: ChatSocketUser;
  authenticating: boolean;
  timeout: ReturnType<typeof setTimeout>;
  conversations: Set<string>;
};

/** Gửi một sự kiện JSON theo contract WebSocket thuần khi socket còn mở. */
export function sendEvent(client: WebSocket, event: string, data: unknown): void {
  if (client.readyState !== WebSocket.OPEN) return;
  client.send(JSON.stringify({ event, data }));
}

/** Quản lý JWT và membership chỉ trong vòng đời của từng kết nối Gateway. */
@Injectable()
export class ChatWsSessionService {
  private readonly sessions = new Map<WebSocket, Session>();
  private readonly rooms = new Map<string, Set<WebSocket>>();

  /** Nhận dịch vụ xác minh JWT hiện có, không tự tạo cơ chế đăng nhập mới. */
  constructor(private readonly auth: ChatSocketAuthService) {}

  /** Đặt thời hạn cho frame chat.auth đầu tiên của một kết nối mới. */
  open(client: WebSocket): void {
    if (this.sessions.has(client)) return;
    const timeout = setTimeout(() => {
      const state = this.sessions.get(client);
      if (!state || state.user) return;
      sendEvent(client, 'chat.error', { code: 'UNAUTHORIZED', message: 'Chưa xác thực kết nối' });
      client.close(4401, 'Authentication timeout');
      this.close(client);
    }, 5_000);
    timeout.unref?.();
    this.sessions.set(client, { authenticating: false, timeout, conversations: new Set() });
  }

  /** Xác minh JWT một lần cho socket; không cho đổi danh tính giữa phiên. */
  async authenticate(client: WebSocket, token: unknown): Promise<void> {
    const state = this.sessions.get(client);
    if (!state) throw new UnauthorizedException('Socket không tồn tại');
    if (state.user || state.authenticating) throw new ConflictException('Socket đã xác thực');
    state.authenticating = true;
    try {
      const user = await this.auth.verify(token);
      if (this.sessions.get(client) !== state || client.readyState !== WebSocket.OPEN) {
        throw new UnauthorizedException('Socket đã đóng');
      }
      state.user = user;
      state.token = token as string;
      clearTimeout(state.timeout);
      sendEvent(client, 'chat.auth.ok', { userId: user.id, role: user.role });
    } finally {
      state.authenticating = false;
    }
  }

  /** Trả danh tính đã xác thực và chặn JWT vừa hết hạn trong lúc socket mở. */
  requireAuth(client: WebSocket): { token: string; user: ChatSocketUser } {
    const state = this.sessions.get(client);
    if (!state?.token || !state.user || state.user.exp <= Date.now() / 1000) {
      throw new UnauthorizedException('Access token required or expired');
    }
    return { token: state.token, user: state.user };
  }

  /** Kiểm tra socket đã được Chat Service cho phép vào hội thoại hay chưa. */
  isJoined(client: WebSocket, conversationId: string): boolean {
    return this.sessions.get(client)?.conversations.has(conversationId) ?? false;
  }

  /** Ghi membership sau khi internal authorize-join trả thành công. */
  join(client: WebSocket, conversationId: string): void {
    this.requireAuth(client);
    const state = this.sessions.get(client)!;
    state.conversations.add(conversationId);
    let members = this.rooms.get(conversationId);
    if (!members) {
      members = new Set();
      this.rooms.set(conversationId, members);
    }
    members.add(client);
  }

  /** Phát tin đã lưu cho các socket trong cùng hội thoại, tối đa một lần/socket. */
  broadcast(conversationId: string, event: string, data: unknown): void {
    for (const client of this.rooms.get(conversationId) ?? []) {
      const user = this.sessions.get(client)?.user;
      if (!user || user.exp <= Date.now() / 1000) {
        sendEvent(client, 'chat.error', { code: 'UNAUTHORIZED', message: 'Access token đã hết hạn' });
        client.close(4401, 'Unauthorized');
        this.close(client);
        continue;
      }
      sendEvent(client, event, data);
    }
  }

  /** Xóa timer và mọi room khi socket ngắt kết nối hoặc xác thực quá hạn. */
  close(client: WebSocket): void {
    const state = this.sessions.get(client);
    if (!state) return;
    clearTimeout(state.timeout);
    this.sessions.delete(client);
    for (const conversationId of state.conversations) {
      const members = this.rooms.get(conversationId);
      members?.delete(client);
      if (members?.size === 0) this.rooms.delete(conversationId);
    }
  }
}
