"use client";

import { useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import type { HomepageCategory } from "@/data/homepage-data";
import CategoryMenu from "./home/CategoryMenu";

type MobileCategoryDrawerProps = {
  open: boolean;
  categories: HomepageCategory[];
  onClose: () => void;
};

export default function MobileCategoryDrawer({
  open,
  categories,
  onClose,
}: MobileCategoryDrawerProps) {
  useEffect(() => {
    if (!open) return;

    const isMobile = window.innerWidth < 1024;

    if (!isMobile) return;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] lg:hidden">
      <button
        type="button"
        aria-label="Đóng lớp nền danh mục"
        onClick={onClose}
        className="absolute inset-0 bg-black/55"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobile-category-title"
        className="relative z-10 h-full w-[min(88vw,360px)] overflow-y-auto bg-white shadow-2xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
          <h2 id="mobile-category-title" className="text-base font-bold text-gray-900">
            Danh mục sản phẩm
          </h2>
          <button
            type="button"
            aria-label="Đóng danh mục"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full text-gray-700 hover:bg-gray-100"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <div className="p-2">
          <CategoryMenu categories={categories} compact onSelect={onClose} />
        </div>
      </aside>
    </div>
  );
}
