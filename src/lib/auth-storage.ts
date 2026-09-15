import type { AuthSession, AuthUser } from "@/types/auth";

export const AUTH_SESSION_STORAGE_KEY = "gearvn.mock.auth.session";

function canUseSessionStorage(): boolean {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isAuthUser(value: unknown): value is AuthUser {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.email === "string" &&
    typeof value.displayName === "string" &&
    value.role === "customer" &&
    typeof value.phone === "string" &&
    typeof value.birthDate === "string" &&
    !("password" in value)
  );
}

function isAuthSession(value: unknown): value is AuthSession {
  return (
    isRecord(value) &&
    isAuthUser(value.user) &&
    typeof value.accessToken === "string" &&
    value.accessToken.startsWith("mock.at.") &&
    typeof value.refreshToken === "string" &&
    value.refreshToken.startsWith("mock.rt.") &&
    typeof value.accessTokenExpiresAt === "number" &&
    Number.isFinite(value.accessTokenExpiresAt) &&
    typeof value.refreshTokenExpiresAt === "number" &&
    Number.isFinite(value.refreshTokenExpiresAt) &&
    !("password" in value)
  );
}

export function readSession(): AuthSession | null {
  if (!canUseSessionStorage()) return null;

  try {
    const rawSession = window.sessionStorage.getItem(AUTH_SESSION_STORAGE_KEY);
    if (!rawSession) return null;

    const parsedSession: unknown = JSON.parse(rawSession);
    if (isAuthSession(parsedSession)) return parsedSession;

    window.sessionStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
    return null;
  } catch {
    try {
      window.sessionStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
    } catch {
      // Storage remains optional in the mock module.
    }
    return null;
  }
}

export function writeSession(session: AuthSession): boolean {
  if (!canUseSessionStorage()) return false;

  try {
    window.sessionStorage.setItem(
      AUTH_SESSION_STORAGE_KEY,
      JSON.stringify(session),
    );
    return true;
  } catch {
    return false;
  }
}

export function clearSession(): void {
  if (!canUseSessionStorage()) return;

  try {
    window.sessionStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
  } catch {
    // Redux still resets even when browser storage is unavailable.
  }
}
