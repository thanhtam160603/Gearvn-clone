import Link from "next/link";
import type { CollectionConfig, CollectionFilterOption } from "@/types/collection";

type MegaCategoryPanelProps = {
  title: string;
  href: string;
  collection?: CollectionConfig;
  options?: Record<string, CollectionFilterOption[]>;
  failed: boolean;
};

const priceRanges = [
  { label: "Dưới 15 triệu", priceMax: 14_999_999 },
  { label: "15 - 25 triệu", priceMin: 15_000_000, priceMax: 24_999_999 },
  { label: "25 - 40 triệu", priceMin: 25_000_000, priceMax: 39_999_999 },
  { label: "Trên 40 triệu", priceMin: 40_000_000 },
];

export default function MegaCategoryPanel({
  title,
  href,
  collection,
  options,
  failed,
}: MegaCategoryPanelProps) {
  const filters = collection?.filters.filter(
    (filter) => filter.type === "checkbox" && (options?.[filter.id]?.length ?? 0) > 0,
  ) ?? [];
  const hasPriceFilter = collection?.filters.some((filter) => filter.type === "price-range");

  return (
    <div className="absolute left-[260px] top-0 z-[45] shrink-0 px-6">
      <div className="w-[912px] rounded-lg border border-neutral-200 bg-white shadow-lg">
        <div className="p-6">
          <div className="flex items-center justify-between py-4 font-bold">
            <h3><Link href={href} className="hover:text-blue-600">{title}</Link></h3>
            <Link href={href} className="text-sm font-medium text-blue-600 hover:text-blue-800">
              Xem tất cả
            </Link>
          </div>

          {!collection && (
            <p className="text-sm text-gray-500">
              {failed ? "Không tải được bộ lọc danh mục." : "Đang tải bộ lọc..."}
            </p>
          )}

          {collection && (
            <div className="flex max-h-[420px] flex-wrap gap-x-8 gap-y-7 overflow-y-auto">
              {hasPriceFilter && (
                <div className="flex w-40 flex-col gap-2">
                  <h4 className="text-sm font-bold text-gray-700">Khoảng giá</h4>
                  {priceRanges.map(({ label, priceMin, priceMax }) => {
                    const query = new URLSearchParams();
                    if (priceMin !== undefined) query.set("priceMin", String(priceMin));
                    if (priceMax !== undefined) query.set("priceMax", String(priceMax));
                    return <Link key={label} href={`${href}?${query}`} className="text-sm text-gray-600 hover:text-blue-600">{label}</Link>;
                  })}
                </div>
              )}

              {filters.map((filter) => (
                <div key={filter.id} className="flex w-40 flex-col gap-2">
                  <h4 className="text-sm font-bold text-gray-700">{filter.label}</h4>
                  <ul className="flex flex-col gap-1">
                    {options?.[filter.id]?.map((option) => (
                      <li key={option.value}>
                        <Link
                          href={`${href}?${new URLSearchParams({ [filter.id]: option.value })}`}
                          className="text-sm text-gray-600 hover:text-blue-600"
                        >
                          {option.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
