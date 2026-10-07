import type { RootState } from "@/lib/store";

export const selectAuth = (state: RootState) => state.auth;
export const selectAuthUser = (state: RootState) => state.auth.user;
export const selectAuthStatus = (state: RootState) => state.auth.status;
export const selectAuthError = (state: RootState) => state.auth.error;
export const selectAuthInitialized = (state: RootState) =>
  state.auth.initialized;
export const selectAccessToken = (state: RootState) =>
  state.auth.accessToken;
export const selectIsAuthenticated = (state: RootState) =>
  state.auth.status === "authenticated" && state.auth.user !== null;

