"use client";

import { useState, type SubmitEvent } from "react";
import { LockClosedIcon, UserIcon } from "@heroicons/react/24/outline";

import { useAppDispatch, useAppSelector } from "@/hooks/redux-hooks";
import {
  selectAuthError,
  selectAuthStatus,
} from "@/store/auth-selectors";
import { login } from "@/store/auth-slice";

type LoginFormProps = {
  onSuccess?: () => void;
};

const errorMessages = {
  INVALID_CREDENTIALS: "Email hoặc mật khẩu không chính xác.",
  SESSION_EXPIRED: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
  REFRESH_FAILED: "Không thể khôi phục phiên đăng nhập.",
  STORAGE_UNAVAILABLE: "Trình duyệt không thể lưu phiên đăng nhập.",
} as const;

export default function LoginForm({
  onSuccess,
}: LoginFormProps) {
  const dispatch = useAppDispatch();
  const status = useAppSelector(selectAuthStatus);
  const error = useAppSelector(selectAuthError);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const isSubmitting = status === "loading";


  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const succeeded = await dispatch(login({ email, password }));

    if (succeeded) {
      onSuccess?.();
      return;
    }

    setPassword("");
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
      <div>
        <label htmlFor="login-email" className="mb-1.5 block text-sm font-medium text-neutral-800">
          Email
        </label>
        <div className="relative">
          <UserIcon className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-neutral-400" />
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Nhập email"
            aria-describedby={error ? "login-error" : undefined}
            className="h-11 w-full rounded-md border border-neutral-300 bg-white pl-10 pr-3 text-sm outline-none transition focus:border-[var(--gearvn-red)]"
          />
        </div>
      </div>

      <div>
        <label htmlFor="login-password" className="mb-1.5 block text-sm font-medium text-neutral-800">
          Mật khẩu
        </label>
        <div className="relative">
          <LockClosedIcon className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-neutral-400" />
          <input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Nhập mật khẩu"
            aria-describedby={error ? "login-error" : undefined}
            className="h-11 w-full rounded-md border border-neutral-300 bg-white pl-10 pr-3 text-sm outline-none transition focus:border-[var(--gearvn-red)]"
          />
        </div>
      </div>

      {error && (
        <p
          id="login-error"
          role="alert"
          className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {errorMessages[error]}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting || !email.trim() || !password}
        className="h-11 w-full rounded-md bg-[var(--gearvn-red)] px-4 text-sm font-bold uppercase text-white transition hover:bg-[var(--gearvn-red-dark)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
      </button>

        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
          <p className="font-semibold">Tài khoản mock dành cho phát triển</p>
          <p>Email: demo@gearvn.local</p>
          <p>Mật khẩu: Demo@123</p>
        </div>
    </form>
  );
}
