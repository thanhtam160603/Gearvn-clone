"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowRightStartOnRectangleIcon,
  ChatBubbleLeftRightIcon,
  ShieldCheckIcon,
  ShoppingBagIcon,
  Squares2X2Icon,
  UserIcon,
} from "@heroicons/react/24/outline";

import { useAppDispatch, useAppSelector } from "@/hooks/redux-hooks";
import { selectAuthStatus, selectAuthUser } from "@/store/auth-selectors";
import { logout } from "@/store/auth-slice";

const navigationItems = [
  { href: "/account", label: "Tổng quan", icon: Squares2X2Icon },
  { href: "/account/orders", label: "Đơn hàng của tôi", icon: ShoppingBagIcon },
  { href: "/account/warranty", label: "Bảo hành", icon: ShieldCheckIcon },
  { href: "/account/profile", label: "Thông tin cá nhân", icon: UserIcon },
];

export default function AccountSidebar() {
  const dispatch = useAppDispatch();
  const pathname = usePathname();
  const router = useRouter();
  const user = useAppSelector(selectAuthUser);
  const status = useAppSelector(selectAuthStatus);

  async function handleLogout() {
    await dispatch(logout());
    router.replace("/");
  }

  if (!user) return null;

  return (
    <aside className="w-full shrink-0 overflow-hidden rounded-lg bg-white shadow-sm lg:w-[220px]">
      <div className="flex items-center gap-3 px-4 pt-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-red-500 font-semibold text-white">
          {user.displayName.charAt(0).toLocaleUpperCase("vi")}
        </span>
        <p className="min-w-0 truncate text-sm font-semibold text-neutral-900">
          {user.displayName}
        </p>
      </div>

      <a
        href="mailto:cskh@gearvn.com"
        className="mx-4 mt-3 flex items-center gap-1.5 pb-4 text-xs text-[var(--gearvn-red)] hover:underline"
      >
        <ChatBubbleLeftRightIcon className="size-4" />
        Liên hệ hỗ trợ
      </a>

      <nav
        aria-label="Điều hướng tài khoản"
        className="flex overflow-x-auto border-t border-neutral-200 lg:block"
      >
        {navigationItems.map((item) => {
          const active =
            item.href === "/account"
              ? pathname === "/account"
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={[
                "flex shrink-0 items-center gap-2.5 border-b-2 px-4 py-3 text-sm transition lg:w-full lg:border-b-0 lg:border-l-2",
                active
                  ? "border-[var(--gearvn-red)] bg-red-50 text-[var(--gearvn-red)]"
                  : "border-transparent text-neutral-700 hover:bg-neutral-50",
              ].join(" ")}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}

        <button
          type="button"
          disabled={status === "loading"}
          onClick={() => void handleLogout()}
          className="flex shrink-0 cursor-pointer items-center gap-2.5 px-4 py-3 text-sm text-neutral-600 transition hover:bg-neutral-50 disabled:cursor-wait disabled:opacity-50 lg:w-full"
        >
          <ArrowRightStartOnRectangleIcon className="size-4" />
          {status === "loading" ? "Đang đăng xuất..." : "Đăng xuất"}
        </button>
      </nav>
    </aside>
  );
}
