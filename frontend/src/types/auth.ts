export type UserRole = "customer" | "support";

export type AccountProfileFields = {
  phone: string;
  birthDate: string;
};

export type AuthUser = {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
} & AccountProfileFields;

export type AuthSession = {
  user: AuthUser;
  accessToken: string;
  accessTokenExpiresAt: number;
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
  | "STORAGE_UNAVAILABLE"
  | "NETWORK_ERROR"
  | "REGISTER_FAILED"
  | "PROFILE_UPDATE_FAILED";

export type AuthState = {
  user: AuthUser | null;
  accessToken: string | null;
  accessTokenExpiresAt: number | null;
  status: AuthStatus;
  error: AuthErrorCode | null;
  initialized: boolean;
};
