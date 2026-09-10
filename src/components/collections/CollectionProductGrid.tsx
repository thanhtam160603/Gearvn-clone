import Link from "next/link";
import type { Product } from "@/types/product";
import ProductCard from "@/components/products/ProductCard";

type CollectionProductGridProps = {
    products: Product[];
    collectionHref: string;
    isCollectionEmpty: boolean;
};

export default function CollectionProductGrid({
    products,
    collectionHref,
    isCollectionEmpty,
}: CollectionProductGridProps) {
    if (products.length === 0) {
        return (
            <div className="rounded-xl bg-white px-4 py-12 text-center">
                <p className="text-neutral-600">
                {isCollectionEmpty
                    ? "Danh mục này chưa có sản phẩm."
                    : "Không tìm thấy sản phẩm phù hợp."}
                </p>

                {!isCollectionEmpty && (
                <Link
                    href={collectionHref}
                    className="mt-4 inline-block text-sm text-red-600 hover:underline"
                >
                    Xóa bộ lọc
                </Link>
                )}
            </div>
        );
    }
    return (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {products.map((product) => (
                <ProductCard key={product.id} product={product} />
            ))}
        </div>
    );
}