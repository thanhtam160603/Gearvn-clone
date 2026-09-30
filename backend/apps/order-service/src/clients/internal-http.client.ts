import { HttpException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { z } from 'zod';

export class UpstreamError extends HttpException {
  constructor(readonly upstreamStatus: number, readonly code: string) {
    const publicStatus = [400, 404, 409].includes(upstreamStatus) ? upstreamStatus
      : code === 'DEPENDENCY_TIMEOUT' ? 504 : 502;
    super({ code, message: 'Không hoàn tất yêu cầu tới service nội bộ' }, publicStatus);
  }
}
const errorSchema = z.object({ code: z.string() });

@Injectable()
export class InternalHttpClient {
  constructor(private readonly config: ConfigService) {}
  async request<T>(
    base: string, path: string, method: 'GET' | 'POST', body: unknown,
    schema: z.ZodType<T>, requestId?: string, extra: Record<string, string> = {},
  ): Promise<T> {
    let response: globalThis.Response;
    let text: string;
    try {
      response = await fetch(new URL(path, base), {
        method, redirect: 'error', signal: AbortSignal.timeout(5_000),
        headers: {
          ...extra, accept: 'application/json',
          'x-internal-service-key': this.config.getOrThrow<string>('INTERNAL_SERVICE_KEY'),
          ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
          ...(requestId ? { 'x-request-id': requestId } : {}),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      text = await response.text();
    } catch (error: unknown) {
      throw new UpstreamError(0, error instanceof Error && error.name === 'TimeoutError'
        ? 'DEPENDENCY_TIMEOUT' : 'DEPENDENCY_UNAVAILABLE');
    }
    let parsed: unknown;
    try { parsed = JSON.parse(text); } catch { parsed = undefined; }
    if (!response.ok) {
      const envelope = errorSchema.safeParse(parsed);
      throw new UpstreamError(response.status,
        envelope.success ? envelope.data.code : 'DEPENDENCY_HTTP_ERROR');
    }
    const decoded = schema.safeParse(parsed);
    if (!decoded.success) throw new UpstreamError(502, 'DEPENDENCY_CONTRACT');
    return decoded.data;
  }
}