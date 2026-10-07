"use client";

import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

type SearchBoxProps = {
  className?: string;
};

export default function SearchBox({ className = "" }: SearchBoxProps) {
  return (
    <div className={`relative w-full ${className}`} role="search">
      <label className="sr-only" htmlFor="site-search">
        Tìm kiếm sản phẩm
      </label>
      <input
        id="site-search"
        type="search"
        placeholder="Bạn cần tìm gì?"
        className="h-10 w-full rounded-md border-0 bg-white py-2 pl-4 pr-11 text-sm text-gray-900 shadow-sm outline-none placeholder:text-gray-500 focus:ring-2 focus:ring-white/70"
      />
      <button
        type="button"
        aria-label="Tìm kiếm"
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-md text-gray-700 transition hover:bg-gray-100 active:bg-gray-200"
      >
        <MagnifyingGlassIcon className="h-5 w-5" />
      </button>
    </div>
  );
}
