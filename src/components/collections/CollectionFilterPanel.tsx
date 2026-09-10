"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { updateCollectionQuery } from "@/lib/collection-query";

import type { CollectionConfig, CollectionFilterSource } from "@/types/collection";
import type { CollectionFilterOption, CollectionFilterState } from "@/lib/collection";

type CollectionFilterPanelProps = {
    config: CollectionConfig;
    options: Record<string, CollectionFilterOption[]>;
    value: CollectionFilterState;
    open: boolean;
    onClose: () => void;
};
type ValueFilterSource = Exclude<CollectionFilterSource, "price">;

export default function CollectionFilterPanel({
    config,
    options,
    value,
    open,
    onClose,
}: CollectionFilterPanelProps) {
    const [draft, setDraft] = useState<CollectionFilterState>(value);
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const isPriceRangeInvalid =
        draft.priceMin !== undefined &&
        draft.priceMax !== undefined &&
        draft.priceMin > draft.priceMax;

    function handleApply() {
        if (isPriceRangeInvalid) return;

        const query = updateCollectionQuery(
            new URLSearchParams(searchParams.toString()),
            { filters: draft },
            config,
        );

        router.push(`${pathname}${query}`, { scroll: false });
        onClose();
    }

    function handleDraftChange(
        source: ValueFilterSource,
        optionValue: string,

    ) { 
        setDraft((prevDraft) => {

            const currentValues = prevDraft.values[source] ?? [];

            const nextValues = currentValues.includes(optionValue)
                ? currentValues.filter((v) => v !== optionValue)
                : [...currentValues, optionValue];

            return {
                ...prevDraft,
                values: {
                    ...prevDraft.values,
                    [source]: nextValues,
                },
            };
        });
    }

    function handleDraftPriceChange(
        field: "priceMin" | "priceMax",
        inputValue: string,
    ){
        const parsedValue = inputValue.trim() ? Number(inputValue) : undefined;

        if (
            parsedValue !== undefined &&
            (!Number.isFinite(parsedValue) || parsedValue < 0)
        ){
            return;
        }
        setDraft((prevDraft) => ({
            ...prevDraft,
            [field]: parsedValue,
        }));
    }

    if (!open) {
        return null;
    }
    return (
        <div className="fixed inset-0 z-[60] lg:hidden">
            <button
            type="button"
            aria-label="Đóng bộ lọc"
            className="absolute inset-0 bg-black/40"
            onClick={onClose}
            />

            <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="collection-filter-title"
            className="absolute inset-y-0 right-0 flex w-[min(88vw,360px)] flex-col bg-white"
            >
            <div className="flex items-center justify-between border-b p-4">
                <h2
                id="collection-filter-title"
                className="text-lg font-semibold"
                >
                Bộ lọc sản phẩm
                </h2>

                <button
                type="button"
                onClick={onClose}
                aria-label="Đóng bộ lọc"
                className="rounded px-3 py-2"
                >
                ×
                </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4">
                {config.filters.map((filter) => {
                    if (
                        filter.type === "price-range"
                    ) {
                        return (
                            <section key={filter.id} 
                            className="mt-5 border-b border-neutral-200 pb-4"
                            >
                                <h3 className="mb-3 text-sm font-semibold text-neutral-700"> 
                                    {filter.label}
                                </h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <label className="text-sm">
                                        <span className="mb-1 block">Từ</span>
                                        <input
                                            type="number"
                                            placeholder="0"
                                            className="w-full rounded border bg-white p-2 text-sm "
                                            min="0"
                                            step="1"
                                            value={draft.priceMin ?? ""}
                                            onChange={(e) => handleDraftPriceChange("priceMin", e.target.value)}
                                        />
                                    </label>
                                    <label className="text-sm">
                                        <span className="mb-1 block">Đến</span>
                                        <input
                                            type="number"
                                            min="0"
                                            step="1"
                                            value={draft.priceMax ?? ""}
                                            onChange={(e) => handleDraftPriceChange("priceMax", e.target.value)}
                                            className="w-full rounded border p-2 text-sm "
                                        />
                                    </label>
                                </div>
                            </section>
                        )
                    }
                    if (
                        filter.type !== "checkbox" ||
                        filter.source === "price"
                    ) {
                        return null;
                    }
                    const source = filter.source;
                    const selectedValues = draft.values[source] ?? [];

                    return (
                        <section key={filter.id} className="mt-5 border-t pt-4">
                            <h3 className="mb-3 text-sm font-semibold text-neutral-700">
                                {filter.label}
                            </h3>
                            <div className="space-y-2">
                                {options[filter.id]?.map((option) => (
                                    <label
                                    key={option.value}
                                    className="flex cursor-pointer items-center gap-2 text-sm"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedValues.includes(option.value)}
                                            onChange={() => handleDraftChange(source, option.value)}
                                            className="size-4 accent-red-500"
                                        />
                                        <span className="text-sm">{option.label}</span>
                                        <span className="text-neutral-500">({option.count})</span>
                                    </label>
                                    
                                ))}
                            </div>
                        </section>
                    );
                })}
            </div>

            <div className="border-t p-4">
                {isPriceRangeInvalid && (
                    <p role="alert" className="mb-3 text-sm text-red-600">
                        Giá từ không được lớn hơn giá đến.
                    </p>
                )}
                <div className="grid grid-cols-2 gap-3">
                <button
                type="button"
                onClick={() => setDraft({ values: {} })}
                className="w-full rounded-lg border px-3 py-2"
                >
                Xóa bộ lọc
                </button>
                <button
                    type="button"
                    onClick={handleApply}
                    disabled={isPriceRangeInvalid}
                    className="rounded-lg bg-[var(--gearvn-red)] px-3 py-2 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                    Áp dụng
                </button>
                </div>
            </div>
            </div>
        </div>

    );
}

