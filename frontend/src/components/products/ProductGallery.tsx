"use client";

import { useState } from "react";
import ProductHighlights from "./ProductHighLights";
import { ProductSpec } from "@/types/product";

type ProductsGalleryProps = {
    images: string[];
    alt: string;
    features?: ProductSpec[];
};

export default function ProductsGallery({ images, alt, features }: ProductsGalleryProps) {
    const [activeIndex, setActiveIndex] = useState(0);
    const activeImage = images[activeIndex] ?? images[0];

    return (
        <div className="contents xl:sticky xl:self-start xl:flex xl:flex-col xl:gap-4 xl:top-6">
            <div className="flex flex-col gap-4">
                <div className="relative h-[280px] w-full overflow-hidden rounded-lg border border-neutral-200 md:h-[400px] lg:h-[371px]">
                    <div className="flex size-full items-center justify-center">
                        <button type="button" className="relative size-[240px] cursor-zoom-in md:size-[340px] lg:size-[360px]">
                            <img
                                src={activeImage}
                                alt={alt}
                                className="h-full w-full object-contain"
                            />
                        </button>
                    </div>
                </div>
                <div className="relative overflow-hidden">
                    <div className="scrollbar-hide flex gap-2 overflow-x-auto">
                        {images.map((image, index)=>(
                            <button type="button" className="relative h-[60px] w-[60px] shrink-0 cursor-pointer rounded-lg border border-neutral-200 md:h-[80px] md:w-[80px]" key={index} onClick={() => setActiveIndex(index)}>
                                <img
                                    src={image}
                                    alt={alt}
                                    className="size-full object-contain"
                                />
                            </button>
                        ))}

                    </div>
                </div>
            </div>
            <div className="order-3 xl:order-none">
                <ProductHighlights specs={features || []} />
            </div>
        </div>
        
    )
}
