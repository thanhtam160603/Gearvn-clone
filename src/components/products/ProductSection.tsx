"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Product, ProductTab } from "@/types/product";
import ProductCarousel from "./ProductCarousel";

type ProductSectionProps = {
    title: string;
    tabs: ProductTab[];
    products: Product[];
    rows?: 1 | 2;
    viewAllHref: string;
};

export default function ProductSection({
    title,
    tabs,
    products,
    rows = 1,
    viewAllHref,
}: ProductSectionProps) {
    
    const [activeTab, setActiveTab] = useState<string | null>(null);

    const filteredProducts = useMemo(() => {
        if (activeTab === null) return products;
        return products.filter((product) => product.tags.includes(activeTab));
    }, [activeTab, products]);

    return (
        <section className="rounded-xl bg-white shadow-sm sm:p-5" aria-label={title}>
            <div className="flex flex-col min-w-0 justify-between gap-3 lg:flex-row lg:items-end ">
                <div className="flex lg:items-center gap-2 min-w-0">
                    <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">{title}</h2>
                </div>
                
                {tabs.length > 0 && (
                    <div
                        role="tablist"
                        aria-label={`Bộ lọc ${title}`}
                        className="flex gap-2 min-w-0 flex-1 overflow-x-auto scrollbar-hide lg:justify-end"
                    >
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.id;

                        return (
                        <button
                            key={tab.id}
                            type="button"
                            role="tab"
                            aria-selected={isActive}
                            onClick={() => setActiveTab(tab.id)}
                            className={`shrink-0 rounded-full px-2 text-xs !font-bold items-center transition sm:text-sm ${
                            isActive
                                ? "bg-[var(--gearvn-white)] text-black"
                                : "bg-white text-gray-600 hover:border-red-200 hover:text-[var(--gearvn-red)]"
                            }`}
                        >
                            {tab.label}
                        </button>
                        );
                    })}
                    </div>
                )}
                <Link
                    href={viewAllHref}
                    className="shrink-0 text-sm font-semibold text-gray-600 transition hover:text-[var(--gearvn-red)]"
                    >
                    Xem tất cả
                    <span aria-hidden="true" className="ml-1">›</span>
                </Link>
            </div>

        

        <div className="mt-4">
            <ProductCarousel products={filteredProducts} rows={rows} />
        </div>
        </section>
    );
}
