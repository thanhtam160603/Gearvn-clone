"use client";

import { useEffect, useState, useRef } from "react";
import {
    heroSlides,
    homepageCategories,
    heroRightBanners,
    heroBottomBanners,
    promoBanners1,
} from "@/data/homepage-data";
import CategoryMenu from "./CategoryMenu";
import HeroCarousel from "./HeroCarousel";
import HeroRightBanner from "./HeroRightBanner";
import HeroBottomBanner from "./HeroBottomBanner";
import { useAppSelector } from "@/hooks/redux-hooks";
import { selectIsCategoryOverlayOpen } from "@/store/ui-selectors";

export default function HeroSection() {
    const categoryAnchorRef = useRef<HTMLElement | null>(null);
    const [isCategoryAnchorVisible, setIsCategoryAnchorVisible] = useState(true);
    const isCategoryOverlayOpen = useAppSelector(selectIsCategoryOverlayOpen);

    const shouldFloatCategory = isCategoryOverlayOpen && !isCategoryAnchorVisible;
    useEffect(() => {
      const categoryAnchor = categoryAnchorRef.current;

      if (!categoryAnchor) return;

      const observer = new IntersectionObserver(([entry]) => {
          setIsCategoryAnchorVisible(entry.isIntersecting);
      });

      observer.observe(categoryAnchor);

      return () => {
          observer.disconnect();
      };
    }, []);
    return (
      <section className="container-shell pt-3" aria-label="Danh mục và khuyến mãi">
        <div className="grid items-stretch gap-3 lg:grid-cols-[280px_minmax(0,1fr)_300px]">
          <aside 
              ref={categoryAnchorRef}
              className={["relative hidden lg:block", isCategoryOverlayOpen ? "z-[46]" : "z-40"].join(" ")}>
            <div className={[
                "w-[280px] overflow-visible rounded-lg border border-gray-200 bg-white p-1.5 shadow-sm",
                shouldFloatCategory
                  ? "fixed top-[112px]"
                  : "relative h-full",
              ].join(" ")}
              style={
                shouldFloatCategory
                  ? {
                      left: "max(16px, calc((100vw - 1240px) / 2))",
                    }
                  : undefined
              }>
              <CategoryMenu categories={homepageCategories} />
            </div>
          </aside>
          <HeroCarousel slides={heroSlides} secondarySlides={promoBanners1} />
          <HeroRightBanner banners={heroRightBanners} />
        </div>
        <div className="mt-3">
          <HeroBottomBanner banners={heroBottomBanners} />
        </div>
      </section>
  );
}
