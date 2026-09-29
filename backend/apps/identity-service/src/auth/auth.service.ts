import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { createHash, randomBytes } from "node:crypto";

import { PrismaService } from "../database/prisma.service";
import { PasswordService } from "./password.service";
import { JwtTokenService } from "./jwt.service";
import type {
  AuthResult,
  AuthUser,
  AccessTokenPayload,
} from "./auth.types";
import { RegisterDTO } from "./dto/register.dto";
import { LoginDTO } from "./dto/login.dto";

const ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000;
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

type UserWithProfile = {
  id: string;
  email: string;
  passwordHash: string;
  role: AuthUser["role"];
  profile: {
    displayName: string;
    phone: string;
    birthDate: Date | null;
  } | null;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
    private readonly tokens: JwtTokenService,
  ) {}

  async register(input: RegisterDTO): Promise<AuthResult> {
    const email = this.normalizeEmail(input.email);
    const displayName = input.name.trim();

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException("Email đã được đăng ký");
    }

    const passwordHash = await this.passwords.hash(input.password);
    const refreshToken = this.createRefreshToken();

    const user = await this.prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email,
          passwordHash,
          role: "CUSTOMER",
          profile: {
            create: {
              displayName,
            },
          },
        },
        include: {
          profile: true,
        },
      });

      await tx.refreshSession.create({
        data: {
          userId: createdUser.id,
          tokenHash: refreshToken.tokenHash,
          expiresAt: refreshToken.expiresAt,
        },
      });

      return createdUser;
    });

    return this.createAuthResult(user, refreshToken);
  }

  async login(input: LoginDTO): Promise<AuthResult> {
    const email = this.normalizeEmail(input.email);

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        profile: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException(
        "Email hoặc mật khẩu không chính xác",
      );
    }

    const passwordValid = await this.passwords.verify(
      user.passwordHash,
      input.password,
    );

    if (!passwordValid) {
      throw new UnauthorizedException(
        "Email hoặc mật khẩu không chính xác",
      );
    }

    const refreshToken = this.createRefreshToken();

    await this.prisma.refreshSession.create({
      data: {
        userId: user.id,
        tokenHash: refreshToken.tokenHash,
        expiresAt: refreshToken.expiresAt,
      },
    });

    return this.createAuthResult(user, refreshToken);
  }

  async refresh(rawRefreshToken: string): Promise<AuthResult> {
    if (!rawRefreshToken?.trim()) {
      throw new UnauthorizedException("Refresh token không hợp lệ");
    }

    const oldTokenHash = this.hashRefreshToken(rawRefreshToken);
    const now = new Date();

    const session = await this.prisma.refreshSession.findUnique({
      where: {
        tokenHash: oldTokenHash,
      },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
      },
    });

    if (
      !session ||
      session.revokedAt !== null ||
      session.expiresAt <= now
    ) {
      throw new UnauthorizedException("Refresh token không hợp lệ");
    }

    const newRefreshToken = this.createRefreshToken();

    const rotatedUser = await this.prisma.$transaction(async (tx) => {
      /*
       * updateMany với điều kiện revokedAt = null giúp chống
       * hai request cùng dùng lại một refresh token.
       */
      const revoked = await tx.refreshSession.updateMany({
        where: {
          id: session.id,
          revokedAt: null,
        },
        data: {
          revokedAt: now,
        },
      });

      if (revoked.count !== 1) {
        throw new UnauthorizedException("Refresh token đã bị sử dụng");
      }

      await tx.refreshSession.create({
        data: {
          userId: session.userId,
          tokenHash: newRefreshToken.tokenHash,
          expiresAt: newRefreshToken.expiresAt,
        },
      });

      return session.user;
    });

    return this.createAuthResult(rotatedUser, newRefreshToken);
  }

  async logout(rawRefreshToken: string): Promise<void> {
    if (!rawRefreshToken?.trim()) {
      return;
    }

    const tokenHash = this.hashRefreshToken(rawRefreshToken);

    await this.prisma.refreshSession.updateMany({
      where: {
        tokenHash,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    /*
     * Logout idempotent:
     * token đã bị revoke hoặc không tồn tại vẫn không báo lỗi.
     */
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private createRefreshToken(): {
    rawToken: string;
    tokenHash: string;
    expiresAt: Date;
  } {
    const rawToken = randomBytes(48).toString("base64url");

    return {
      rawToken,
      tokenHash: this.hashRefreshToken(rawToken),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    };
  }

  private hashRefreshToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  private async createAuthResult(
    user: UserWithProfile,
    refreshToken: {
      rawToken: string;
      expiresAt: Date;
    },
  ): Promise<AuthResult> {
    const accessTokenExpiresAt = new Date(
      Date.now() + ACCESS_TOKEN_TTL_MS,
    );

    const payload: AccessTokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.tokens.signAccessToken(payload);

    return {
      user: this.toPublicUser(user),
      accessToken,
      accessTokenExpiresAt,
      refreshToken: refreshToken.rawToken,
      refreshTokenExpiresAt: refreshToken.expiresAt,
    };
  }

  private toPublicUser(user: UserWithProfile): AuthUser {
    return {
      id: user.id,
      email: user.email,
      displayName: user.profile?.displayName ?? "",
      phone: user.profile?.phone ?? "",
      birthDate: user.profile?.birthDate
        ? user.profile.birthDate.toISOString().slice(0, 10)
        : null,
      role: user.role,
    };
  }
}