"use client";

import { useRouter } from "next/navigation";
import { UserCircleIcon } from "@heroicons/react/24/outline";
import { selectIsLoginDialogOpen } from "@/store/ui-selectors";
import { openLoginDialog } from "@/store/ui-slice";
import AccountMenu from "@/components/account/AccountMenu";
import { useAppDispatch, useAppSelector } from "@/hooks/redux-hooks";
import {
  selectAuthInitialized,
  selectAuthStatus,
  selectAuthUser,
} from "@/store/auth-selectors";
import { logout } from "@/store/auth-slice";

const accountClassName =
  "flex h-10 items-center gap-1.5 rounded-md bg-black px-2 text-white transition active:scale-[0.98]";

export default function AuthStatusButton() {
  const loginDialogOpen = useAppSelector(selectIsLoginDialogOpen);
  const router = useRouter();
  const dispatch = useAppDispatch();
  const initialized = useAppSelector(selectAuthInitialized);
  const status = useAppSelector(selectAuthStatus);
  const user = useAppSelector(selectAuthUser);

  function handleOpenLogin() {
    const nextPath = `${window.location.pathname}${window.location.search}`;

    dispatch(openLoginDialog(nextPath));
  }

  async function handleLogout() {
    await dispatch(logout());
    router.replace("/");
  }

  if (!initialized) {
    return (
      <div
        aria-label="Đang kiểm tra trạng thái đăng nhập"
        className={`${accountClassName} min-w-10 animate-pulse text-white/60 lg:min-w-[108px]`}
      >
        <UserCircleIcon className="h-7 w-7" />
        <span className="hidden text-xs font-semibold lg:block">Đang tải</span>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <button
          type="button"
          onClick={handleOpenLogin}
          aria-label="Mở hộp thoại đăng nhập"
          aria-haspopup="dialog"
          aria-expanded={loginDialogOpen}
          className={`${accountClassName} cursor-pointer hover:bg-neutral-900`}
        >
          <UserCircleIcon className="h-7 w-7" />

          <span className="hidden text-xs font-semibold leading-4 lg:block">
            Đăng nhập
          </span>
        </button>
      </>
    );
  }

  return (
    <AccountMenu
      user={user}
      loggingOut={status === "loading"}
      onLogout={() => void handleLogout()}
    />
  );
}
