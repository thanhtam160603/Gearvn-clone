import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";

import { JwtTokenService } from "./jwt.service";
import type { RequestWithUser } from "./auth.types";

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    private readonly tokens: JwtTokenService,
  ) {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request =
      context.switchToHttp().getRequest<RequestWithUser>();

    const authorization =
      request.headers.authorization;

    if (!authorization?.startsWith("Bearer ")) {
      throw new UnauthorizedException(
        "Missing access token",
      );
    }

    const token = authorization.slice("Bearer ".length);

    request.user =
      await this.tokens.verifyAccessToken(token);

    return true;
  }
}