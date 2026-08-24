"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid";
import type { HeroSlide } from "@/data/homepage-data";
import { getNextSlide, getPreviousSlide } from "@/lib/carousel";

type HeroCarouselProps = {
  slides: HeroSlide[];
  secondarySlides: HeroSlide[];
  intervalMs?: number;
};

type CarouselPanelProps = {
  slides: HeroSlide[];
  intervalMs: number;
  priority?: boolean;
  label: string;
};

function CarouselPanel({
  slides,
  intervalMs,
  priority = false,
  label,
}: CarouselPanelProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (slides.length <= 1 || paused) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    const timer = window.setInterval(() => {
      setActiveIndex((current) => getNextSlide(current, slides.length));
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [intervalMs, paused, slides.length]);

  if (slides.length === 0) {
    return <div className="rounded-lg bg-gray-200" aria-label="Chưa có banner" />;
  }

  const activeSlide = slides[Math.min(activeIndex, slides.length - 1)];
  const hasNavigation = slides.length > 1;

  return (
    <section
      aria-roledescription="carousel"
      aria-label={label}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
      }}
      className="group relative min-h-0 overflow-hidden rounded-lg bg-white shadow-sm"
    >
      <Image
        key={activeSlide.id}
        src={activeSlide.src}
        alt={activeSlide.alt}
        fill
        priority={priority}
        sizes="(max-width: 767px) calc(100vw - 24px), (max-width: 1279px) calc(100vw - 280px), 950px"
        className="object-cover"
      />

      {hasNavigation && (
        <>
          <button
            type="button"
            aria-label="Banner trước"
            onClick={() => setActiveIndex((current) => getPreviousSlide(current, slides.length))}
            className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-800 opacity-90 shadow transition hover:bg-white md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Banner tiếp theo"
            onClick={() => setActiveIndex((current) => getNextSlide(current, slides.length))}
            className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-800 opacity-90 shadow transition hover:bg-white md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-black/20 px-2 py-1.5">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                aria-label={`Xem banner ${index + 1}`}
                aria-current={index === activeIndex ? "true" : undefined}
                onClick={() => setActiveIndex(index)}
                className={`h-2 rounded-full transition-all ${index === activeIndex ? "w-5 bg-[var(--gearvn-red)]" : "w-2 bg-white/90 hover:bg-white"}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

export default function HeroCarousel({
  slides,
  secondarySlides,
  intervalMs = 5000,
}: HeroCarouselProps) {
  return (
    <div className="grid w-full aspect-[2/1] min-h-0 grid-rows-[6fr_4fr] gap-3">
      <CarouselPanel
        slides={slides}
        intervalMs={intervalMs}
        priority
        label="Khuyến mãi nổi bật"
      />
      <CarouselPanel
        slides={secondarySlides}
        intervalMs={intervalMs}
        label="Khuyến mãi phụ"
      />
    </div>
  );
}
