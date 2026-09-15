"use client";

import { TrophyIcon } from "@heroicons/react/24/outline";

import { ACCOUNT_NEXT_TIER_POINTS } from "@/data/account-data";
import { useAppSelector } from "@/hooks/redux-hooks";
import { selectAuthUser } from "@/store/auth-selectors";

export default function AccountOverview() {
  const user = useAppSelector(selectAuthUser);
  const currentPoints = 0;
  const progress = Math.min(
    100,
    Math.round((currentPoints / ACCOUNT_NEXT_TIER_POINTS) * 100),
  );

  if (!user) return null;

  return (
    <section className="relative overflow-hidden rounded-xl bg-[#686868] px-5 py-5 text-white shadow-sm sm:px-6">
      <div className="relative z-10 flex items-center gap-3">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-white text-base font-bold text-neutral-900">
          {user.displayName.charAt(0).toLocaleUpperCase("vi")}
        </span>
        <div>
          <p className="text-xs font-semibold uppercase text-white/80">
            Hạng <span className="rounded bg-white/20 px-1.5 py-0.5 text-white">Regular</span>
          </p>
          <p className="mt-1 text-sm font-semibold">
            {currentPoints.toLocaleString("vi-VN")} điểm
          </p>
          <p className="mt-1 text-xs text-white/75">
            Còn {ACCOUNT_NEXT_TIER_POINTS.toLocaleString("vi-VN")} điểm để lên hạng G-NEW
          </p>
        </div>
      </div>

      <div className="relative z-10 mt-5">
        <div className="flex items-center justify-between text-xs text-white/80">
          <span>Tiến độ lên G-NEW</span>
          <span>{progress}%</span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/20">
          <div
            className="h-full rounded-full bg-white"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <TrophyIcon className="absolute -bottom-5 right-3 size-24 text-white/10 sm:right-8" />
    </section>
  );
}
