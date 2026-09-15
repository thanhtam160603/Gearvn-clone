import {
  DEFAULT_ACCESS_TOKEN_LIFETIME_MS,
  DEFAULT_REFRESH_TOKEN_LIFETIME_MS,
} from "@/lib/auth-constants";

export type AuthTokenFactoryOptions = {
  now?: () => number;
  randomId?: () => string;
  accessTokenLifetimeMs?: number;
  refreshTokenLifetimeMs?: number;
};

function defaultRandomId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now().toString(36)}.${Math.random().toString(36).slice(2)}`;
}

export function createAuthTokenFactory(options: AuthTokenFactoryOptions = {}) {
  const now = options.now ?? Date.now;
  const randomId = options.randomId ?? defaultRandomId;
  const accessTokenLifetimeMs =
    options.accessTokenLifetimeMs ?? DEFAULT_ACCESS_TOKEN_LIFETIME_MS;
  const refreshTokenLifetimeMs =
    options.refreshTokenLifetimeMs ?? DEFAULT_REFRESH_TOKEN_LIFETIME_MS;

  return {
    createAccessToken() {
      const issuedAt = now();

      return {
        token: `mock.at.${randomId()}`,
        expiresAt: issuedAt + accessTokenLifetimeMs,
      };
    },

    createRefreshToken() {
      const issuedAt = now();

      return {
        token: `mock.rt.${randomId()}`,
        expiresAt: issuedAt + refreshTokenLifetimeMs,
      };
    },
  };
}
