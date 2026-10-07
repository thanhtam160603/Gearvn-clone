import Image from "next/image";
import { promoBanners1 } from "@/data/homepage-data";

export default function PromoStrip1() {
  return (
    <section id="khuyen-mai" aria-label="Ưu đãi nổi bật">
      <div className="grid grid-cols-1 gap-2 lg:grid-cols-[2fr_1fr]">
        <div className="relative aspect-[10/3] overflow-hidden rounded-lg bg-white shadow-sm">
          <Image
            src={promoBanners1[0].src}
            alt={promoBanners1[0].alt}
            fill
            sizes="(max-width: 639px) calc(100vw - 24px), 610px"
            className="object-cover"
          />
        </div>
        <div className="grid grid-rows-2 gap-3">
            {promoBanners1.slice(1, 3).map((banner) => (
                <div
                    key={banner.id}
                    className="relative aspect-[10/3] min-h-[120px] overflow-hidden rounded-lg bg-white shadow-sm"
                >
                    <Image
                        src={banner.src}
                        alt={banner.alt}
                        fill
                        sizes="(max-width: 1023px) 100vw, 420px"
                        className="object-cover"
                    />
                </div>
            ))}
        </div>
      </div>
    </section>
  );
}
