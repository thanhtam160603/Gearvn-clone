"use client";

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

export default function HeroSection() {
  return (
    <section className="container-shell pt-3" aria-label="Danh mục và khuyến mãi">
      <div className="grid items-stretch gap-3 lg:grid-cols-[280px_minmax(0,1fr)_300px]">
        <aside className="relative z-40 hidden overflow-visible rounded-lg border border-gray-200 bg-white p-1.5 shadow-sm lg:block">
          <CategoryMenu categories={homepageCategories} />
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
