import { apiClient, authClient } from "./client";
import type { AuthSession, AuthUser } from "@/types/auth";

type User = Omit<AuthUser, "role" | "birthDate"> & {
  role: "CUSTOMER" | "SUPPORT";
  birthDate: string | null;
};

type UserSession = {
  user: User;
  accessToken: string;
  accessTokenExpiresAt: string;
};

function toUser(user: User): AuthUser {
  return { ...user, role: user.role === "SUPPORT" ? "support" : "customer", birthDate: user.birthDate ?? "" };
}

function toSession(session: UserSession): AuthSession {
  return {
    user: toUser(session.user),
    accessToken: session.accessToken,
    accessTokenExpiresAt: Date.parse(session.accessTokenExpiresAt),
  };
}

export async function loginUser(input: {
  email: string;
  password: string;
}): Promise<AuthSession> {
  const { data } = await apiClient.post<UserSession>("/api/auth/login", input);
  return toSession(data);
}

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
}): Promise<AuthSession> {
  const { data } = await apiClient.post<UserSession>("/api/auth/register", input);
  return toSession(data);
}

export async function refreshSession(): Promise<AuthSession> {
  const { data } = await apiClient.post<UserSession>("/api/auth/refresh");
  return toSession(data);
}

export async function logoutUser(): Promise<void> {
  await apiClient.post("/api/auth/logout");
}

export async function getMe(): Promise<AuthUser> {
  const { data } = await authClient.get<User>("/api/users/me");
  return toUser(data);
}

export async function patchMe(input: {
  name: string;
  phone: string;
  birthDate: string | null;
}): Promise<AuthUser> {
  const { data } = await authClient.patch<User>("/api/users/me", input);
  return toUser(data);
}
