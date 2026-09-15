"use client";

import { useEffect, useRef } from "react";

import { useAppDispatch, useAppSelector } from "@/hooks/redux-hooks";
import { AUTH_REFRESH_LEAD_TIME_MS } from "@/lib/auth-constants";
import {
  selectAuthInitialized,
  selectAuthStatus,
  selectAuth,
} from "@/store/auth-selectors";
import {
  bootstrapSession,
  refreshAccessToken,
} from "@/store/auth-slice";

export default function AuthBootstrap() {
  const dispatch = useAppDispatch();
  const initialized = useAppSelector(selectAuthInitialized);
  const status = useAppSelector(selectAuthStatus);
  const { accessTokenExpiresAt, refreshToken } = useAppSelector(selectAuth);
  const bootstrapStarted = useRef(false);

  useEffect(() => {
    if (bootstrapStarted.current) return;

    bootstrapStarted.current = true;
    void dispatch(bootstrapSession());
  }, [dispatch]);

  useEffect(() => {
    if (
      !initialized ||
      status !== "authenticated" ||
      !refreshToken ||
      accessTokenExpiresAt === null
    ) {
      return;
    }

    const remainingLifetime = accessTokenExpiresAt - Date.now();
    const leadTime = Math.min(
      AUTH_REFRESH_LEAD_TIME_MS,
      Math.max(0, remainingLifetime / 2),
    );
    const refreshDelay = Math.max(0, remainingLifetime - leadTime);

    const timer = window.setTimeout(() => {
      void dispatch(refreshAccessToken());
    }, refreshDelay);

    return () => window.clearTimeout(timer);
  }, [
    accessTokenExpiresAt,
    dispatch,
    initialized,
    refreshToken,
    status,
  ]);

  return null;
}
