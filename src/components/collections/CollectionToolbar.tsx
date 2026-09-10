"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { CollectionConfig } from "@/types/collection";
import { CollectionFilterOption, CollectionFilterState, CollectionSort } from "@/lib/collection";
import { updateCollectionQuery } from "@/lib/collection-query";
import CollectionFilterPanel from "./CollectionFilterPanel";

type CollectionToolbarProps = {
    config: CollectionConfig;
    options: Record<string, CollectionFilterOption[]>;
    filter: CollectionFilterState;
    sort: CollectionSort;
    totalItems: number;
};

const sortOptions: {
    value: CollectionSort;
    label: string;
}[] = [
    { value: "default", label: "Mặc định" },
    { value: "price-asc", label: "Giá tăng dần" },
    { value: "price-desc", label: "Giá giảm dần" },
    { value: "name-asc", label: "Tên (A-Z)" },
];

export default function CollectionToolbar({ 
    config, 
    options, 
    filter, 
    sort, 
    totalItems 
}: CollectionToolbarProps) {
    const [filterPanelOpen, setFilterPanelOpen] = useState(false);

    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    function handleSortChange(nextSort: CollectionSort) {
        if (nextSort === sort) return;

        const query = updateCollectionQuery(
            new URLSearchParams(searchParams.toString()),
            { sort: nextSort },
            config,
        );

        router.push(`${pathname}${query}`, { scroll: false });
    }

    return (
        <>
            <div className="mb-4 rounded-xl bg-white p-3">
                <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-neutral-600">
                        Tìm thấy{" "}
                        <strong className="text-neutral-900">{totalItems}</strong>
                        {" "}sản phẩm
                    </p>
                    <button
                    type="button"
                    className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700 transition-colors hover:bg-neutral-50"
                    onClick={() => setFilterPanelOpen(true)}
                    aria-haspopup="dialog"
                    aria-expanded={filterPanelOpen}
                    >
                        Lọc
                    </button>
                </div>
                <div 
                    role="group"
                    aria-label="Sắp xếp sản phẩm"
                    className="mt-3 flex items-center gap-2 overflow-x-auto pb-1"
                >
                    {sortOptions.map((option) => (
                        <button 
                            key={option.value}
                            type="button"
                            aria-pressed={sort === option.value}
                            onClick={() => handleSortChange(option.value)}
                            className={[
                                "shrink-0 rounded-lg border px-3 py-2 text-sm",
                                sort === option.value
                                ? "border-red-600 bg-red-50 text-red-600"
                                : "border-neutral-200 text-neutral-700",
                            ].join(" ")}
                        >
                            {option.label}
                        </button>
                    ))}                   
                </div>
                {filterPanelOpen && (
                    <CollectionFilterPanel
                        config={config}
                        options={options}
                        value={filter}
                        open={filterPanelOpen}
                        onClose={() => setFilterPanelOpen(false)}
                    />
                )}
            </div>
        </>
    )
}