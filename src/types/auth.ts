export type UserRole = "customer";

export type AccountProfileFields = {
  phone: string;
  birthDate: string;
};

export type MockUser = {
  id: string;
  email: string;
  password: string;
  displayName: string;
  role: UserRole;
} & AccountProfileFields;

export type AuthUser = {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
} & AccountProfileFields;

export type AuthSession = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: number;
  refreshTokenExpiresAt: number;
};

export type AuthStatus =
  | "idle"
  | "loading"
  | "authenticated"
  | "unauthenticated"
  | "error";

export type AuthErrorCode =
  | "INVALID_CREDENTIALS"
  | "SESSION_EXPIRED"
  | "REFRESH_FAILED"
  | "STORAGE_UNAVAILABLE";

export type AuthState = {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  accessTokenExpiresAt: number | null;
  refreshTokenExpiresAt: number | null;
  status: AuthStatus;
  error: AuthErrorCode | null;
  initialized: boolean;
};
