"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { useAppSelector, useAppDispatch } from "@/hooks/redux-hooks";
import { openLoginDialog } from "@/store/ui-slice";
import {
  selectAuthInitialized,
  selectAuthStatus,
  selectAuthUser,
  selectIsAuthenticated,
} from "@/store/auth-selectors";

type AuthGateProps = {
  children: ReactNode;
};

export default function AuthGate({ children }: AuthGateProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialized = useAppSelector(selectAuthInitialized);
  const authenticated = useAppSelector(selectIsAuthenticated);
  const status = useAppSelector(selectAuthStatus);
  const user = useAppSelector(selectAuthUser);
  const isLoggingOut = status === "loading" && user !== null;
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!initialized || authenticated) return;

    if (isLoggingOut) {
      router.replace("/");
      return;
    }

    const queryString = searchParams.toString();
    const nextPath = queryString ? `${pathname}?${queryString}` : pathname;
    dispatch(openLoginDialog(nextPath));
    router.replace("/");
  }, [
    authenticated,
    dispatch,
    initialized,
    isLoggingOut,
    pathname,
    router,
    searchParams,
  ]);

  if (!initialized || !authenticated) {
    return (
      <div className="flex min-h-48 items-center justify-center text-sm text-neutral-500">
        Đang kiểm tra phiên đăng nhập...
      </div>
    );
  }

  return children;
}
