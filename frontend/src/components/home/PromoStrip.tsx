import Image from "next/image";
import { promoBanners } from "@/data/homepage-data";

export default function PromoStrip() {
  return (
    <section id="khuyen-mai" aria-label="Ưu đãi nổi bật" className="container-shell py-3">
      <div className="grid gap-3 sm:grid-cols-2">
        {promoBanners.map((banner) => (
          <div key={banner.id} className="relative aspect-[10/3] overflow-hidden rounded-lg bg-white shadow-sm">
            <Image
              src={banner.src}
              alt={banner.alt}
              fill
              sizes="(max-width: 639px) calc(100vw - 24px), 610px"
              className="object-cover"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
