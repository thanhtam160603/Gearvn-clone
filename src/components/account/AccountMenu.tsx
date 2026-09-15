"use client";

import Link from "next/link";
import {
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
} from "@headlessui/react";
import {
  ArrowRightStartOnRectangleIcon,
  ChevronDownIcon,
  ShoppingBagIcon,
  UserIcon,
} from "@heroicons/react/24/outline";

import type { AuthUser } from "@/types/auth";

type AccountMenuProps = {
  user: AuthUser;
  loggingOut: boolean;
  onLogout: () => void;
};

const menuItemClassName =
  "flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-neutral-700 transition data-focus:bg-red-50 data-focus:text-[var(--gearvn-red)]";

export default function AccountMenu({
  user,
  loggingOut,
  onLogout,
}: AccountMenuProps) {
  return (
    <Menu>
      <MenuButton className="flex h-10 max-w-[150px] cursor-pointer items-center gap-1.5 rounded-md bg-black px-2 text-white transition hover:bg-neutral-900 active:scale-[0.98]">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-neutral-900">
          {user.displayName.charAt(0).toLocaleUpperCase("vi")}
        </span>
        <span className="hidden min-w-0 truncate text-xs font-semibold lg:block">
          {user.displayName}
        </span>
        <ChevronDownIcon className="hidden size-4 shrink-0 lg:block" />
      </MenuButton>

      <MenuItems
        transition
        anchor="bottom end"
        className="z-[80] mt-2 w-[230px] origin-top-right rounded-lg bg-white text-neutral-800 shadow-xl ring-1 ring-black/5 transition duration-100 ease-out [--anchor-gap:8px] data-closed:scale-95 data-closed:opacity-0"
      >
        <div className="border-b border-neutral-200 px-3 py-3">
          <p className="truncate text-sm font-semibold text-neutral-900">
            {user.displayName}
          </p>
          <p className="mt-1 truncate text-xs text-neutral-500">
            {user.email}
          </p>
        </div>

        <div className="py-1">
          <MenuItem>
            <Link href="/account" className={menuItemClassName}>
              <UserIcon className="size-4" />
              Tài khoản của tôi
            </Link>
          </MenuItem>
          <MenuItem>
            <Link href="/account/orders" className={menuItemClassName}>
              <ShoppingBagIcon className="size-4" />
              Đơn hàng của tôi
            </Link>
          </MenuItem>
        </div>

        <div className="border-t border-neutral-200 py-1">
          <MenuItem>
            <button
              type="button"
              disabled={loggingOut}
              onClick={onLogout}
              className={`${menuItemClassName} cursor-pointer disabled:cursor-wait disabled:opacity-50`}
            >
              <ArrowRightStartOnRectangleIcon className="size-4" />
              {loggingOut ? "Đang đăng xuất..." : "Đăng xuất"}
            </button>
          </MenuItem>
        </div>
      </MenuItems>
    </Menu>
  );
}
