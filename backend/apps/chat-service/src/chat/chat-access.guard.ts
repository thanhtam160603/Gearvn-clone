import { Injectable, ExecutionContext, CanActivate, UnauthorizedException} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import type { ChatRequest } from "./chat-user";

@Injectable()
export class ChatAccessGuard implements CanActivate {
  constructor(
    private readonly config: ConfigService, 
    private readonly jwt: JwtService
    ) {}
    async canActivate(context: ExecutionContext) {
        const req = context.switchToHttp().getRequest<ChatRequest>();
        const header = req.headers.authorization;
        const match = typeof header === 'string' ? /^Bearer (\S+)$/.exec(header) : null;
        if (!match) throw new UnauthorizedException();
        let payload: Record<string, unknown>;
        try{
            payload = await this.jwt.verifyAsync<Record<string, unknown>>(match[1], {
                publicKey: this.config.getOrThrow<string>('JWT_PUBLIC_KEY').replace(/\\n/g, '\n'),
                algorithms: ['RS256'],
            });
        } catch {
            throw new UnauthorizedException();
        }
        if (typeof payload.sub !== 'string' || !payload.sub ||
            typeof payload.exp !== 'number' || !Number.isFinite(payload.exp) ||
            payload.exp <= Date.now() / 1000 ||
            (payload.role !== 'CUSTOMER' && payload.role !== 'SUPPORT')) {
            throw new UnauthorizedException();
        }
        req.user = { id: payload.sub, role: payload.role };
        return true;
    }
}