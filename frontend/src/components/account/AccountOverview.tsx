"use client";
import Link from "next/link";
import { useAppSelector } from "@/hooks/redux-hooks";
import { selectAuthUser } from "@/store/auth-selectors";

export default function AccountOverview() {
  const user = useAppSelector(selectAuthUser);
  if (!user) return null;
  return <section className="rounded-xl bg-neutral-800 p-5 text-white shadow-sm sm:p-6">
    <div className="flex items-center gap-3">
      <span className="flex size-12 items-center justify-center rounded-full bg-white font-bold text-neutral-900">{user.displayName.charAt(0).toLocaleUpperCase("vi")}</span>
      <div><h1 className="font-semibold">{user.displayName}</h1><p className="text-sm text-white/75">{user.email}</p></div>
    </div>
    <div className="mt-5 flex flex-wrap gap-3 text-sm">
      <Link href="/account/orders" className="rounded-lg bg-white px-4 py-2 font-medium text-neutral-900">Xem đơn hàng</Link>
      <Link href="/account/profile" className="rounded-lg border border-white/50 px-4 py-2">Cập nhật hồ sơ</Link>
    </div>
  </section>;
}
