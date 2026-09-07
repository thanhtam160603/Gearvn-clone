"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Bars3Icon,
  ShoppingCartIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { homepageCategories, quickLinks } from "@/data/homepage-data";
import MobileCategoryDrawer from "./MobileCategoryDrawer";
import SearchBox from "./SearchBox";
import { useAppDispatch, useAppSelector } from "@/hooks/redux-hooks";
import { openDrawer } from "@/store/cart-slice";
import { selectCartTotalQuantity } from "@/store/cart-selectors";


export default function AppHeader() {
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [isHeaderHidden, setIsHeaderHidden] = useState(false);
  const dispatch = useAppDispatch();
  const totalQuantity = useAppSelector(selectCartTotalQuantity);

  const handleCartClick = () => {
    dispatch(openDrawer());
  };

  useEffect(() => {
    const handleStickyVisibility = (event: Event) => {
      const customEvent = event as CustomEvent<{ visible: boolean }>;
      setIsHeaderHidden(customEvent.detail.visible);
    };

    window.addEventListener(
      "sticky-product-bar-visibility",
      handleStickyVisibility,
    );

    return () => {
      window.removeEventListener(
        "sticky-product-bar-visibility",
        handleStickyVisibility,
      );
    };
  }, []);

  return (
    <>
      <header
        className={`sticky top-0 z-50 w-full bg-white shadow-sm transition-transform duration-200 ${
          isHeaderHidden ? "-translate-y-full" : "translate-y-0"
        }`}
      >
        <div className="bg-[var(--gearvn-red)] text-white">
          <div className="container-shell flex flex-wrap items-center gap-2 py-2 md:flex-nowrap md:gap-3">
            <div className="shrink-0">
              <Link
                href="/"
                aria-label="Trang chủ GearVN"
                className="flex h-10 w-[92px] items-center sm:w-[110px]"
              >
                <Image
                  src="/logo-gearvn.svg"
                  alt="GEARVN"
                  width={120}
                  height={40}
                  priority
                  className="h-auto w-full brightness-0 invert"
                />
              </Link>
            </div>

            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 md:flex-nowrap md:gap-3">
              <button
                type="button"
                aria-label="Mở danh mục sản phẩm"
                aria-expanded={categoryOpen}
                onClick={() => setCategoryOpen(true)}
                className="flex h-10 shrink-0 items-center gap-2 rounded-md bg-[#be0015] px-2.5 text-sm font-semibold transition hover:bg-[#a90012] active:scale-[0.98] md:px-3"
              >
                <Bars3Icon className="h-6 w-6" />
                <span className="hidden lg:inline">Danh mục</span>
              </button>

              <SearchBox className="mt-0.5 min-w-0 basis-full md:mt-0 md:min-w-[260px] md:flex-1 md:basis-auto" />
            </div>

            <div className="order-2 ml-auto flex shrink-0 items-center gap-1 md:order-none md:ml-0 md:gap-2">
              <button
                type="button"
                aria-label="Giỏ hàng"
                onClick={handleCartClick}
                className="relative flex h-10 items-center gap-1.5 rounded-md px-2 bg-black transition hover:pointer-events-none active:scale-[0.98]"
              >
                <ShoppingCartIcon className="h-7 w-7" />
                <span className="absolute right-0.5 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-[var(--gearvn-red)]">{totalQuantity}</span>
              </button>

              <button
                type="button"
                aria-label="Tài khoản"
                className="flex h-10 items-center gap-1.5 rounded-md px-2 bg-black transition hover:pointer-events-none active:scale-[0.98]"
              >
                <UserCircleIcon className="h-7 w-7" />
                <span className="hidden text-xs font-semibold leading-4 lg:block">Đăng nhập</span>
              </button>

            </div>
          </div>
        </div>

        <nav aria-label="Liên kết nhanh" className="hidden border-b border-gray-200 bg-white lg:block">
          <div className="container-shell flex h-11 items-center justify-between">
            {quickLinks.map(({ label, href, icon: Icon }) => (
              <a
                key={label}
                href={href}
                className="flex h-full items-center gap-2 px-3 text-[13px] font-medium text-gray-700 transition hover:text-[var(--gearvn-red)]"
              >
                <Icon className="h-[18px] w-[18px] text-[var(--gearvn-red)]" />
                {label}
              </a>
            ))}
          </div>
        </nav>
      </header>

      <MobileCategoryDrawer
        open={categoryOpen}
        categories={homepageCategories}
        onClose={() => setCategoryOpen(false)}
      />
    </>
  );
}
