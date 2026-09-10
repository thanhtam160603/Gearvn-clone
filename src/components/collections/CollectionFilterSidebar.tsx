"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { SubmitEvent } from "react";
import type {
    CollectionConfig,
    CollectionFilterSource,
} from "@/types/collection";
import type {
    CollectionFilterOption,
    CollectionFilterState,
} from "@/lib/collection";
import { updateCollectionQuery } from "@/lib/collection-query";

type ValueFilterSource = Exclude<CollectionFilterSource, "price">;

type CollectionFilterSidebarProps = {
    config: CollectionConfig;
    options: Record<string, CollectionFilterOption[]>;
    value: CollectionFilterState;
};

export default function CollectionFilterSidebar({
    config,
    options,
    value,
}: CollectionFilterSidebarProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    function parsePriceInput(value: string): number | undefined {
        if (!value.trim()) {
            return undefined;
        }

        const parsedValue = Number(value);

        return Number.isFinite(parsedValue) && parsedValue >= 0
            ? parsedValue
            : undefined;
    }

    function handlePriceSubmit(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault();

        const formData = new FormData(event.currentTarget);

        const getFormValue = (name: string) => {
            const formValue = formData.get(name);

            return typeof formValue === "string" ? formValue : "";
        };

        const nextPriceMin = parsePriceInput(getFormValue("priceMin"));
        const nextPriceMax = parsePriceInput(getFormValue("priceMax"));
        const maxInput = event.currentTarget.elements.namedItem("priceMax");

        if (!(maxInput instanceof HTMLInputElement)) return;

        const isInvalid =
            nextPriceMin !== undefined &&
            nextPriceMax !== undefined &&
            nextPriceMin > nextPriceMax;

        maxInput.setCustomValidity(
            isInvalid ? "Giá đến phải lớn hơn hoặc bằng giá từ." : "",
        );

        if (isInvalid) {
            maxInput.reportValidity();
            return;
        }

        const nextFilters: CollectionFilterState = {
            ...value,
            priceMin: nextPriceMin,
            priceMax: nextPriceMax,
        };

        const currentParams = new URLSearchParams(searchParams.toString());

        const query = updateCollectionQuery(
            currentParams,
            { filters: nextFilters },
            config,
        );

        router.push(`${pathname}${query}`, { scroll: false });
    }

    function handleFilterChange(
        source: ValueFilterSource,
        optionValue: string,
    ) {
        const currentValues = value.values[source] ?? [];

        const nextValues = currentValues.includes(optionValue)
            ? currentValues.filter((item) => item !== optionValue)
            : [...currentValues, optionValue];

        const nextFilters: CollectionFilterState = {
            ...value,
            values: {
                ...value.values,
                [source]: nextValues,
            },
        };

        const currentParams = new URLSearchParams(searchParams.toString());

        const query = updateCollectionQuery(
            currentParams,
            { filters: nextFilters },
            config,
        );

        router.push(`${pathname}${query}`, { scroll: false });
    }

    function handleClearFilters() {
        const query = updateCollectionQuery(
            new URLSearchParams(searchParams.toString()),
            { filters: { values: {} } },
            config,
        );

        router.push(`${pathname}${query}`, { scroll: false });
    }
    return (
        <aside className="hidden w-60 shrink-0 lg:block">
            <div className="rounded-xl bg-white p-4">
                <h2 className="text-lg font-bold">Bộ lọc tìm kiếm</h2>
                <button
                    type="button"
                    onClick={handleClearFilters}
                    className="mt-2 text-sm text-red-600 hover:underline"
                >
                    Xóa bộ lọc
                </button>

                {config.filters.map((filter) => {
                    if (
                        filter.type === "price-range"
                    ) {
                        return (
                            <section
                                key={filter.id}
                                className="mt-5 border-t pt-4"
                            >
                                <h3 className="mb-3 text-sm font-semibold text-neutral-700">
                                    {filter.label}
                                </h3>

                                <form
                                    key={JSON.stringify([
                                        config.slug,
                                        value.priceMin ?? null,
                                        value.priceMax ?? null,
                                    ])}
                                    onSubmit={handlePriceSubmit}
                                    onInput={(event) => {
                                        const maxInput = event.currentTarget.elements.namedItem("priceMax");
                                        if (maxInput instanceof HTMLInputElement) {
                                            maxInput.setCustomValidity("");
                                        }
                                    }}
                                    className="space-y-3"
                                >
                                    <div className="grid grid-cols-2 gap-2">
                                        <input
                                            name="priceMin"
                                            type="number"
                                            min="0"
                                            defaultValue={value.priceMin ?? ""}
                                            aria-label="Giá từ"
                                            placeholder="Giá từ"
                                            className="w-full rounded border px-2 py-1.5 text-sm"
                                        />

                                        <input
                                            name="priceMax"
                                            type="number"
                                            min="0"
                                            defaultValue={value.priceMax ?? ""}
                                            aria-label="Giá đến"
                                            placeholder="Giá đến"
                                            className="w-full rounded border px-2 py-1.5 text-sm"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full rounded bg-[var(--gearvn-red)] px-3 py-2 text-sm font-medium text-white"
                                    >
                                        Áp dụng
                                    </button>
                                </form>
                            </section>
                        )
                    }

                    if (
                        filter.type !== "checkbox" ||
                        filter.source === "price"
                    ) {
                        return null;
                    }

                    const source: ValueFilterSource = filter.source;

                    return (
                        <section
                            key={filter.id}
                            className="mt-5 border-t pt-4"
                        >
                            <h3 className="mb-2 text-sm font-semibold text-neutral-700">
                                {filter.label}
                            </h3>

                            <div className="mt-3 space-y-2">
                                {(options[filter.id] ?? []).map((option) => {
                                    const checked =
                                        value.values[source]?.includes(
                                            option.value,
                                        ) ?? false;

                                    return (
                                        <label
                                            key={option.value}
                                            className="flex cursor-pointer items-center gap-2 text-sm"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() =>
                                                    handleFilterChange(
                                                        source,
                                                        option.value,
                                                    )
                                                }
                                            />
                                            <span>{option.label}</span>
                                            <span className="text-xs text-neutral-400">
                                                ({option.count})
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                        </section>
                    );
                })}
            </div>
        </aside>
    );
}
