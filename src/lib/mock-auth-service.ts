import { mockUsers, toAuthUser } from "@/data/auth-users";
import {
  createAuthTokenFactory,
  type AuthTokenFactoryOptions,
} from "@/lib/auth-token";
import type {
  AuthErrorCode,
  AuthSession,
  AuthUser,
} from "@/types/auth";

type RefreshTokenRecord = {
  userId: string;
  expiresAt: number;
};

export class AuthServiceError extends Error {
  constructor(public readonly code: AuthErrorCode) {
    super(code);
    this.name = "AuthServiceError";
  }
}

export type MockAuthServiceOptions = AuthTokenFactoryOptions & {
  delayMs?: number;
};

export function createMockAuthService(options: MockAuthServiceOptions = {}) {
  const now = options.now ?? Date.now;
  const delayMs = options.delayMs ?? 250;
  const tokenFactory = createAuthTokenFactory(options);
  const activeRefreshTokens = new Map<string, RefreshTokenRecord>();

  async function waitForMockLatency(): Promise<void> {
    if (delayMs <= 0) return;

    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  function createSession(
    user: AuthUser,
    refreshExpiresAt?: number,
  ): AuthSession {
    const access = tokenFactory.createAccessToken();
    const refresh = tokenFactory.createRefreshToken();
    const effectiveRefreshExpiresAt = refreshExpiresAt ?? refresh.expiresAt;

    activeRefreshTokens.set(refresh.token, {
      userId: user.id,
      expiresAt: effectiveRefreshExpiresAt,
    });

    return {
      user,
      accessToken: access.token,
      refreshToken: refresh.token,
      accessTokenExpiresAt: access.expiresAt,
      refreshTokenExpiresAt: effectiveRefreshExpiresAt,
    };
  }

  return {
    async login(email: string, password: string): Promise<AuthSession> {
      await waitForMockLatency();

      const normalizedEmail = email.trim().toLocaleLowerCase("en");
      const mockUser = mockUsers.find(
        (user) => user.email.toLocaleLowerCase("en") === normalizedEmail,
      );

      if (!mockUser || mockUser.password !== password) {
        throw new AuthServiceError("INVALID_CREDENTIALS");
      }

      return createSession(toAuthUser(mockUser));
    },

    async refresh(refreshToken: string): Promise<AuthSession> {
      await waitForMockLatency();

      const record = activeRefreshTokens.get(refreshToken);

      if (!record || record.expiresAt <= now()) {
        activeRefreshTokens.delete(refreshToken);
        throw new AuthServiceError("REFRESH_FAILED");
      }

      const mockUser = mockUsers.find((user) => user.id === record.userId);

      if (!mockUser) {
        activeRefreshTokens.delete(refreshToken);
        throw new AuthServiceError("REFRESH_FAILED");
      }

      // Refresh-token rotation: revoke the old token and preserve the
      // original refresh-session expiry instead of extending it forever.
      activeRefreshTokens.delete(refreshToken);

      return createSession(toAuthUser(mockUser), record.expiresAt);
    },

    async logout(refreshToken: string): Promise<void> {
      await waitForMockLatency();
      activeRefreshTokens.delete(refreshToken);
    },

    restoreSession(session: AuthSession): AuthSession | null {
      const mockUser = mockUsers.find((user) => user.id === session.user.id);

      if (!mockUser || session.refreshTokenExpiresAt <= now()) {
        return null;
      }

      activeRefreshTokens.set(session.refreshToken, {
        userId: session.user.id,
        expiresAt: session.refreshTokenExpiresAt,
      });

      return {
        ...session,
        user: toAuthUser(mockUser),
      };
    },
  };
}

export const mockAuthService = createMockAuthService();

export function getAuthErrorCode(error: unknown): AuthErrorCode {
  return error instanceof AuthServiceError ? error.code : "REFRESH_FAILED";
}
