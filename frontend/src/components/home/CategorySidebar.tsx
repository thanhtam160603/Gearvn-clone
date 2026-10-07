import type { Category } from "@/types/store";

type CategorySidebarProps = {
  categories: Category[];
  activeCategory: string | null;
  onCategoryHover: (category: string) => void;
  onCategoryClick?: (category: string) => void;
};

export function CategorySidebar({
  categories,
  activeCategory,
  onCategoryHover,
  onCategoryClick,
}: CategorySidebarProps) {
  return (
    <div className="w-full shrink-0 rounded-2xl bg-white p-2 shadow-sm lg:w-[270px]">
      <div className="max-h-[520px] overflow-y-auto pr-1">
        {categories.map((category) => {
          const active = activeCategory === category.id;

          return (
            <button
              key={category.id}
              type="button"
              onMouseEnter={() => onCategoryHover(category.id)}
              onClick={() => onCategoryClick?.(category.id)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                active
                  ? "bg-gray-100 font-semibold text-[#d70018]"
                  : "text-gray-800 hover:bg-gray-50 hover:text-[#d70018]"
              }`}
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg ${
                  active ? "bg-red-50 text-[#d70018]" : "bg-gray-50 text-[#d70018]"
                }`}
              >
                {category.icon}
              </span>

              <span className="min-w-0 flex-1 truncate">{category.label}</span>
              <span className="text-lg leading-none text-gray-400">›</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}