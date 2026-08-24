import Image from "next/image";

type BottomBanner ={
    id: string;
    src: string;
    alt: string;
}

type HeroBottomBannerProps = {
    banners: BottomBanner[];
}

export default function HeroBottomBanner({ banners }: HeroBottomBannerProps) {
    return (
        <section
            aria-label="Khuyến mãi"
            className="mt-3 hidden grid-cols-4 gap-4 lg:grid"
        >
            {banners.map((banner) => (
                <div
                key={banner.id}
                className="relative aspect-[2/1] overflow-hidden rounded-lg"
                >
                <Image
                    src={banner.src}
                    alt={banner.alt}
                    fill
                    sizes="(min-width: 1024px) 25vw"
                    className="object-cover"
                />
                </div>
            ))}
        </section>
    )
}

