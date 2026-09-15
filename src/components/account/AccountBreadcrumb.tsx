"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const labelsByPathname: Record<string, string> = {
  "/account": "Tổng quan",
  "/account/orders": "Đơn hàng của tôi",
  "/account/warranty": "Yêu cầu bảo hành",
  "/account/profile": "Thông tin cá nhân",
};

export default function AccountBreadcrumb() {
  const pathname = usePathname();
  const label = labelsByPathname[pathname] ?? "Tài khoản";

  return (
    <nav aria-label="Breadcrumb" className="text-xs text-neutral-400">
      <Link href="/" className="font-medium text-neutral-700 hover:text-[var(--gearvn-red)]">
        Trang chủ
      </Link>
      <span className="mx-2">/</span>
      <span>{label}</span>
    </nav>
  );
}
