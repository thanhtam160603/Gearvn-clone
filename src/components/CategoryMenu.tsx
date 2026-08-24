"use client";

import { useState } from "react";
import { ChevronRightIcon } from "@heroicons/react/24/solid";
import type { HomepageCategory } from "@/data/homepage-data";
import { categoryMenuData } from "@/data/category-menu-data";
import MegaCategoryPanel from "./MegaCategoryPanel";

type CategoryMenuProps = {
  categories: HomepageCategory[];
  onSelect?: (id: string) => void;
  compact?: boolean;
};

export default function CategoryMenu({
  categories,
  onSelect,
  compact = false,
}: CategoryMenuProps) {
    const [activeCategoryId, setActiveCategoryId] = useState<string | null>(
    null
    );

    const activeMenu = categoryMenuData.find(
      (menu) => menu.id === activeCategoryId
    );
  return (
  <nav
    aria-label="Danh mục sản phẩm"
    className="relative w-full bg-white"
    onMouseLeave={() => {
      if (!compact) {
        setActiveCategoryId(null);
      }
    }}
  >
    <ul className={compact ? "space-y-0.5" : "space-y-px"}>
      {categories.map(({ id, label, icon: Icon }) => {
        const isActive = activeCategoryId === id;

        return (
          <li
            key={id}
            onMouseEnter={() => {
              if (!compact) {
                setActiveCategoryId(id);
              }
            }}
          >
            <button
              type="button"
              aria-expanded={isActive}
              onFocus={() => {
                if (!compact) {
                  setActiveCategoryId(id);
                }
              }}
              onClick={() => {
                if (!compact) {
                  setActiveCategoryId(id);
                }

                onSelect?.(id);
              }}
              className={`group flex w-full items-center gap-3 rounded-md text-left transition ${
                compact
                  ? "min-h-11 px-3 py-2 text-sm"
                  : "min-h-8 px-2.5 py-1 text-[13px]"
              } ${
                isActive
                  ? "bg-red-50 text-[var(--gearvn-red)]"
                  : "text-gray-800 hover:bg-red-50 hover:text-[var(--gearvn-red)]"
              }`}
            >
              <Icon
                className={`h-[18px] w-[18px] shrink-0 ${
                  isActive
                    ? "text-[var(--gearvn-red)]"
                    : "text-gray-700"
                }`}
              />

              <span className="min-w-0 flex-1 leading-5">
                {label}
              </span>

              <ChevronRightIcon className="h-3.5 w-3.5 shrink-0 text-gray-400" />
            </button>
          </li>
        );
      })}
    </ul>

    {!compact && activeMenu && (
      <MegaCategoryPanel menu={activeMenu} />
    )}
  </nav>
);
}
