import Image from "next/image";

type RightBanner ={
    id: string;
    src: string;
    alt: string;
}

type HeroRightBannerProps = {
    banners: RightBanner[];
}

export default function HeroRightBanner({ banners }: HeroRightBannerProps) {
    return (
        <aside
            aria-label="Khuyến mãi"
            className="hidden grid-rows-4 gap-2 lg:grid"
        >
            {banners.map((banner) => (
                <div key={banner.id} className="relative h-full w-full">
                    <Image
                        src={banner.src}
                        alt={banner.alt}
                        fill
                        sizes="200px"
                        className="rounded-lg object-cover"
                    />
                </div>
            ))}
        </aside>
    );
}
