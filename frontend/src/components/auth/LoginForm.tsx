"use client";

import { useState, type SubmitEvent } from "react";
import { LockClosedIcon, UserIcon } from "@heroicons/react/24/outline";

import { useAppDispatch, useAppSelector } from "@/hooks/redux-hooks";
import {
  selectAuthError,
  selectAuthStatus,
} from "@/store/auth-selectors";
import { login, register } from "@/store/auth-slice";

type LoginFormProps = {
  onSuccess?: () => void;
};

const errorMessages = {
  INVALID_CREDENTIALS: "Email hoặc mật khẩu không chính xác.",
  SESSION_EXPIRED: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
  REFRESH_FAILED: "Không thể khôi phục phiên đăng nhập.",
  STORAGE_UNAVAILABLE: "Trình duyệt không thể lưu phiên đăng nhập.",
  NETWORK_ERROR: "Không kết nối được máy chủ. Vui lòng thử lại.",
  REGISTER_FAILED: "Không thể tạo tài khoản. Kiểm tra thông tin rồi thử lại.",
  PROFILE_UPDATE_FAILED: "Không thể cập nhật hồ sơ.",
} as const;

export default function LoginForm({
  onSuccess,
}: LoginFormProps) {
  const dispatch = useAppDispatch();
  const status = useAppSelector(selectAuthStatus);
  const error = useAppSelector(selectAuthError);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [registering, setRegistering] = useState(false);
  const isSubmitting = status === "loading";


  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const succeeded = registering
      ? await dispatch(register({ name, email, password }))
      : await dispatch(login({ email, password }));

    if (succeeded) {
      onSuccess?.();
      return;
    }

    setPassword("");
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
      {registering && (
        <div>
          <label htmlFor="register-name" className="mb-1.5 block text-sm font-medium text-neutral-800">
            Họ và tên
          </label>
          <input
            id="register-name"
            name="name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="h-11 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-[var(--gearvn-red)]"
          />
        </div>
      )}
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
        disabled={isSubmitting || !email.trim() || !password || (registering && !name.trim())}
        className="h-11 w-full rounded-md bg-[var(--gearvn-red)] px-4 text-sm font-bold uppercase text-white transition hover:bg-[var(--gearvn-red-dark)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Đang xử lý..." : registering ? "Tạo tài khoản" : "Đăng nhập"}
      </button>

      <button
        type="button"
        onClick={() => setRegistering((value) => !value)}
        className="w-full text-sm font-medium text-[var(--gearvn-red)] hover:underline"
      >
        {registering ? "Đã có tài khoản? Đăng nhập" : "Chưa có tài khoản? Đăng ký"}
      </button>
    </form>
  );
}
