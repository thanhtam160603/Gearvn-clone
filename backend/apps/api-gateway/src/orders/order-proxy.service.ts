import { BadGatewayException, GatewayTimeoutException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';

@Injectable()
export class OrderProxyService {
    private readonly base: URL;
    constructor(config: ConfigService) {
        this.base = new URL(config.getOrThrow<string>('ORDER_SERVICE_URL'));
        if (!['http:', 'https:'].includes(this.base.protocol)) {
        throw new Error('ORDER_SERVICE_URL phải dùng HTTP/HTTPS');
        }
    }
    async forward(path: string, req: Request, res: Response): Promise<void> {
        const url = new URL(path, this.base);
        url.search = new URL(req.originalUrl, 'http://gateway.local').search;
        const headers: Record<string, string> = { accept: 'application/json' };
        if (req.headers.authorization) headers.authorization = req.headers.authorization;
        const key = req.headers['idempotency-key'];
        if (typeof key === 'string') headers['idempotency-key'] = key;
        const requestId = res.getHeader('X-Request-Id');
        if (typeof requestId === 'string') headers['x-request-id'] = requestId;
        const hasBody = req.method === 'POST' || req.method === 'PATCH';
        if (hasBody) headers['content-type'] = 'application/json';
        let upstream: globalThis.Response;
        let body: string;
        try {
        upstream = await fetch(url, {
            method: req.method, headers, redirect: 'error',
            body: hasBody ? JSON.stringify(req.body ?? {}) : undefined,
            signal: AbortSignal.timeout(30_000),
        });
        body = await upstream.text();
        } catch (error) {
        if (error instanceof Error && error.name === 'TimeoutError') {
            throw new GatewayTimeoutException({
            code: 'DEPENDENCY_TIMEOUT', message: 'Order phản hồi quá chậm',
            });
        }
        throw new BadGatewayException({
            code: 'DEPENDENCY_UNAVAILABLE', message: 'Không kết nối được Order',
        });
        }
        const retryAfter = upstream.headers.get('retry-after');
        if (retryAfter) res.setHeader('Retry-After', retryAfter);
        res.status(upstream.status);
        res.type(upstream.headers.get('content-type') ?? 'application/json');
        res.send(body);
    }
}