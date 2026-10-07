import Link from "next/link";
import { notFound } from "next/navigation";
import AppHeader from "@/components/common/AppHeader";
import AppFooter from "@/components/common/AppFooter";
import ProductCard from "@/components/products/ProductCard";
import { getCategories, listProducts } from "@/lib/api/catalog";

export default async function SectionPage({ params, searchParams }: {
  params: Promise<{ section: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { section } = await params;
  const categories = await getCategories();
  const category = categories.find((item) => item.slug === section);
  if (!category) notFound();
  const requestedPage = Number((await searchParams).page);
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const products = await listProducts({ section, page, pageSize: 20 });
  return <><AppHeader /><main className="container-shell flex-1 py-6">
    <h1 className="text-2xl font-bold">{category.title}</h1>
    <p className="mt-1 text-sm text-neutral-500">{products.totalItems} sản phẩm</p>
    <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {products.items.map((product) => <ProductCard key={product.id} product={product} />)}
    </div>
    {!products.items.length && <p className="mt-6 rounded-lg bg-white p-6 text-center text-sm text-neutral-500">Chưa có sản phẩm trong danh mục này.</p>}
    {products.totalPages > 1 && <nav aria-label="Trang sản phẩm" className="mt-6 flex justify-center gap-4 text-sm">
      {products.page > 1 && <Link href={`/products/${section}?page=${products.page - 1}`} className="rounded-lg border bg-white px-4 py-2">Trang trước</Link>}
      <span className="py-2">{products.page} / {products.totalPages}</span>
      {products.page < products.totalPages && <Link href={`/products/${section}?page=${products.page + 1}`} className="rounded-lg border bg-white px-4 py-2">Trang sau</Link>}
    </nav>}
  </main><AppFooter /></>;
}
