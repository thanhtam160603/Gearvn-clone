import {
  BadGatewayException,
  GatewayTimeoutException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';

@Injectable()
export class ChatProxyService {
  private readonly base: URL;

  constructor(config: ConfigService) {
    this.base = new URL(config.getOrThrow<string>('CHAT_SERVICE_URL'));
    if (!['http:', 'https:'].includes(this.base.protocol)) {
      throw new Error('CHAT_SERVICE_URL phải dùng HTTP/HTTPS');
    }
  }

  async forward(path: string, req: Request, res: Response): Promise<void> {
    const target = new URL(path, this.base);
    target.search = new URL(req.originalUrl, 'http://gateway.local').search;
    const headers: Record<string, string> = { accept: 'application/json' };
    if (req.headers.authorization) {
      headers.authorization = req.headers.authorization;
    }
    const requestId = res.getHeader('X-Request-Id');
    if (typeof requestId === 'string') {
      headers['x-request-id'] = requestId;
    }
    const hasBody = req.method === 'POST' || req.method === 'PATCH';
    if (hasBody) headers['content-type'] = 'application/json';

    let upstream: globalThis.Response;
    let body: string;
    try {
      upstream = await fetch(target, {
        method: req.method,
        headers,
        body: hasBody ? JSON.stringify(req.body ?? {}) : undefined,
        signal: AbortSignal.timeout(5_000),
        redirect: 'error',
      });
      body = await upstream.text();
    } catch (error) {
      if (error instanceof Error && error.name === 'TimeoutError') {
        throw new GatewayTimeoutException('Chat phản hồi quá chậm');
      }
      throw new BadGatewayException('Không kết nối được Chat Service');
    }

    const retryAfter = upstream.headers.get('retry-after');
    if (retryAfter) res.setHeader('Retry-After', retryAfter);
    res.status(upstream.status);
    res.type(upstream.headers.get('content-type') ?? 'application/json');
    res.send(body);
  }
}
