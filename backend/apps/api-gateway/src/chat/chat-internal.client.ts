import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export class ChatInternalError extends Error {
  constructor(readonly status: number) {
    super('Chat internal request failed');
  }
}

export type ChatMessageView = {
  id: string;
  conversationId: string;
  senderId: string;
  clientMessageId: string;
  body: string;
  createdAt: string;
};

@Injectable()
export class ChatInternalClient {
  private readonly base: URL;

  constructor(private readonly config: ConfigService) {
    this.base = new URL(config.getOrThrow<string>('CHAT_SERVICE_URL'));
    if (!['http:', 'https:'].includes(this.base.protocol)) {
      throw new Error('CHAT_SERVICE_URL phải dùng HTTP/HTTPS');
    }
  }

  private async post<T>(path: string, token: string, body?: object): Promise<T> {
    let response: globalThis.Response;
    try {
      response = await fetch(new URL(path, this.base), {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
          'x-internal-service-key': this.config.getOrThrow<string>(
            'INTERNAL_SERVICE_KEY',
          ),
          ...(body ? { 'content-type': 'application/json' } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(5_000),
        redirect: 'error',
      });
    } catch {
      throw new ChatInternalError(503);
    }
    if (!response.ok) throw new ChatInternalError(response.status);
    try {
      return (await response.json()) as T;
    } catch {
      throw new ChatInternalError(502);
    }
  }

  async authorizeJoin(conversationId: string, token: string): Promise<void> {
    await this.post<{ conversationId: string }>(
      `/internal/chat/conversations/${encodeURIComponent(conversationId)}/authorize-join`,
      token,
    );
  }

  send(
    conversationId: string,
    token: string,
    input: { clientMessageId: string; body: string },
  ): Promise<{ message: ChatMessageView; created: boolean }> {
    return this.post(
      `/internal/chat/conversations/${encodeURIComponent(conversationId)}/messages`,
      token,
      input,
    );
  }
}
