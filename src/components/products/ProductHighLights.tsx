import {
  ChevronRightIcon,
  CpuChipIcon,
  ComputerDesktopIcon,
  CircleStackIcon,
} from "@heroicons/react/24/outline";
import type { ProductSpec } from "@/types/product";

type ProductHighlightsProps = {
  specs: ProductSpec[];
};

const iconMap: Record<string, typeof CpuChipIcon> = {
  CPU: CpuChipIcon,
  Mainboard: ComputerDesktopIcon,
  RAM: CircleStackIcon,
};

export default function ProductHighlights({ specs }: ProductHighlightsProps) {
  return (
    <section className="bg-white">
        <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900">
                Thông số nổi bật
            </h2>

            <button
                type="button"
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
            >
                Xem tất cả thông số
                <ChevronRightIcon className="h-4 w-4" />
            </button>
        </div>
        <div className="grid grid-cols-2 border-b border-gray-200 pb-4 sm:grid-cols-3">
            {specs.slice(0, 3).map((spec) => {
            const Icon = iconMap[spec.label] ?? CpuChipIcon;

            return (
                <div
                key={`${spec.label}-${spec.value}`}
                className="min-w-0 border-gray-200 py-3 pr-3 sm:border-r sm:px-4 first:pl-0 last:border-r-0"
                >
                <p className="text-xs font-medium text-gray-500">
                    {spec.label}
                </p>

                <div className="mt-2 flex items-start gap-2">
                    <Icon className="h-5 w-5 shrink-0 text-gray-500" />

                    <p className="min-w-0 text-sm font-semibold text-gray-900">
                        {spec.value}
                    </p>
                </div>
                </div>
            );
            })}
        </div>
    </section>
    )
}