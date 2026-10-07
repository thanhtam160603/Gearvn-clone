import type { INestApplicationContext } from '@nestjs/common';
import { WsAdapter } from '@nestjs/platform-ws';
import type { WebSocketServer } from 'ws';

type RawFrame = string | Buffer | ArrayBuffer | Buffer[];

/** Parse một frame thành sự kiện Nest; frame sai được chuyển thành chat.invalid. */
function parseFrame(raw: RawFrame): { event: string; data: unknown } {
  try {
    const text = Array.isArray(raw)
      ? Buffer.concat(raw).toString('utf8')
      : Buffer.isBuffer(raw)
        ? raw.toString('utf8')
        : typeof raw === 'string'
          ? raw
          : Buffer.from(raw).toString('utf8');
    const value: unknown = JSON.parse(text);
    if (
      typeof value === 'object' && value !== null && !Array.isArray(value) &&
      'event' in value && typeof value.event === 'string' &&
      'data' in value
    ) {
      return { event: value.event, data: value.data };
    }
  } catch {
    // Frame của client không hợp lệ: không để JSON.parse làm hỏng kết nối.
  }
  return { event: 'chat.invalid', data: null };
}

/** Gắn WebSocket thuần vào HTTP Gateway và lọc Origin ngay lúc upgrade. */
export class ChatWsAdapter extends WsAdapter {
  /** Nhận Nest app và origin frontend sau khi config đã được nạp lúc bootstrap. */
  constructor(app: INestApplicationContext, private readonly allowedOrigin: string) {
    super(app, { messageParser: parseFrame });
  }

  /** Giới hạn kích thước frame và chỉ chấp nhận browser Origin đã cấu hình. */
  override create(port: number, options?: Record<string, unknown> & { path?: string }): WebSocketServer {
    return super.create(port, {
      ...options,
      maxPayload: 16_384,
      verifyClient: (info: { origin: string }) => info.origin === this.allowedOrigin,
    }) as WebSocketServer;
  }
}
