import { timingSafeEqual } from 'node:crypto';
import {
  CanActivate, ExecutionContext, Injectable, UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

@Injectable()
export class InternalServiceGuard implements CanActivate {
    constructor(private readonly config: ConfigService) {}

    canActivate(context: ExecutionContext): boolean {
        const req = context.switchToHttp().getRequest<Request>();
        const value = req.header('X-Internal-Service-Token');
        if (typeof value !== 'string') throw new UnauthorizedException();
        const expected = Buffer.from(this.config.getOrThrow<string>('INTERNAL_SERVICE_KEY'));
        const received = Buffer.from(value);
        if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
            throw new UnauthorizedException();
        }
        return true;
    }
}