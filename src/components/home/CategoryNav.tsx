import type { Category } from "../types/store";

type CategoryNavProps = {
  categories: Category[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
};

export function CategoryNav({ categories, activeCategory, onCategoryChange }: CategoryNavProps) {
  return (
    <section className="container-shell mt-10" id="categories">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#d70018]">Khám phá theo nhu cầu</p>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">Danh mục sản phẩm</h2>
        </div>
        <span className="hidden text-sm text-gray-500 sm:block">Chọn nhóm sản phẩm bạn quan tâm</span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {categories.map((category) => {
          const active = activeCategory === category.id;
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => onCategoryChange(category.id)}
              className={`group rounded-xl border p-4 text-center transition ${
                active
                  ? "border-[#d70018] bg-[#d70018] text-white shadow-lg shadow-red-200"
                  : "border-gray-200 bg-white text-gray-700 hover:-translate-y-0.5 hover:border-red-200 hover:text-[#d70018]"
              }`}
            >
              <span className={`mx-auto flex h-10 w-10 items-center justify-center rounded-xl text-xl font-bold ${active ? "bg-white/15" : "bg-gray-100 group-hover:bg-red-50"}`}>
                {category.icon}
              </span>
              <span className="mt-2 block text-xs font-bold leading-4">{category.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}