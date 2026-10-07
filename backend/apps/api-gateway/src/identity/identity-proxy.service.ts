import {
  BadGatewayException,
  GatewayTimeoutException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';

@Injectable()
export class IdentityProxyService {
  private readonly baseUrl: URL;

  constructor(config: ConfigService) {
    this.baseUrl = new URL(config.getOrThrow<string>('IDENTITY_SERVICE_URL'));
    if (!['http:', 'https:'].includes(this.baseUrl.protocol)) {
      throw new Error('IDENTITY_SERVICE_URL phải dùng HTTP hoặc HTTPS');
    }
  }

  async forward(path: string, req: Request, res: Response): Promise<void> {
    const target = new URL(path, this.baseUrl);
    target.search = new URL(req.originalUrl, 'http://gateway.local').search;
    const headers: Record<string, string> = { accept: 'application/json' };
    if (req.headers.authorization) headers.authorization = req.headers.authorization;
    if (req.headers.cookie) headers.cookie = req.headers.cookie;
    const requestId = res.getHeader('X-Request-Id');
    if (typeof requestId === 'string') headers['x-request-id'] = requestId;

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
        throw new GatewayTimeoutException('Identity phản hồi quá chậm');
      }
      throw new BadGatewayException('Không thể kết nối Identity');
    }

    for (const cookie of upstream.headers.getSetCookie()) {
      res.append('Set-Cookie', cookie);
    }
    res.status(upstream.status);
    res.type(upstream.headers.get('content-type') ?? 'application/json');
    res.send(body);
  }
}
