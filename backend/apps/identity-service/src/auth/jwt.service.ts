import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { IdentityEnv } from '../config/identity-env';
import type { AccessTokenPayload } from './auth.types';

@Injectable()
export class JwtTokenService {
    constructor(
        private readonly jwtService: NestJwtService,
        private readonly configService: ConfigService<IdentityEnv, true>
    ) {}

    signAccessToken(payload: AccessTokenPayload): Promise<string> {
        return this.jwtService.signAsync(payload, {
            privateKey: this.normalizeKey(this.configService.get('JWT_PRIVATE_KEY', { infer: true })),
            algorithm: 'RS256',
            expiresIn: "15m",
        });
    }

    async verifyAccessToken(token: string): Promise<AccessTokenPayload> {
        try {
            return await this.jwtService.verifyAsync<AccessTokenPayload>(token, {
                publicKey: this.normalizeKey(this.configService.get('JWT_PUBLIC_KEY', { infer: true })),
                algorithms: ['RS256'],
            });
        }
        catch {
            throw new UnauthorizedException('Invalid access token');
        }
    }
    private normalizeKey(value: string): string {
        return value.replace(/\\n/g, "\n");
    }
}
