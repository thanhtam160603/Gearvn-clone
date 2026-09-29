import type { Request } from 'express';

export type AuthUser = {
  id: string;
  email: string;
  displayName: string;
  role: "CUSTOMER" | "SUPPORT";
  phone: string;
  birthDate: string | null;
};

export type AccessTokenPayload = {
  sub: string;
  email: string;
  role: AuthUser["role"];
};

export type AuthResult = {
  user: AuthUser;
  accessToken: string;
  accessTokenExpiresAt: Date;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
};

export type RequestWithUser = Request & {
  user: AccessTokenPayload;
};