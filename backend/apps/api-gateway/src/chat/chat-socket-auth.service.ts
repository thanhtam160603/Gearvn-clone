import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

export type ChatSocketUser = {
  id: string;
  role: 'CUSTOMER' | 'SUPPORT';
  exp: number;
};

@Injectable()
export class ChatSocketAuthService {
  constructor(
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
  ) {}

  async verify(token: unknown): Promise<ChatSocketUser> {
    if (typeof token !== 'string' || !token) {
      throw new UnauthorizedException('Access token required');
    }
    let payload: Record<string, unknown>;
    try {
      payload = await this.jwt.verifyAsync<Record<string, unknown>>(token, {
        publicKey: this.config
          .getOrThrow<string>('JWT_PUBLIC_KEY')
          .replace(/\\n/g, '\n'),
        algorithms: ['RS256'],
      });
    } catch {
      throw new UnauthorizedException('Invalid access token');
    }
    if (
      typeof payload.sub !== 'string' ||
      !payload.sub ||
      (payload.role !== 'CUSTOMER' && payload.role !== 'SUPPORT') ||
      typeof payload.exp !== 'number' ||
      !Number.isFinite(payload.exp) ||
      payload.exp <= Date.now() / 1000
    ) {
      throw new UnauthorizedException('Invalid access token');
    }
    return { id: payload.sub, role: payload.role, exp: payload.exp };
  }
}
