import type { Product } from "@/types/product";
import ProductCarousel from "./ProductCarousel";

type SimilarProductsProps = {
    products: Product[];
};

export default function SimilarProducts({ products }: SimilarProductsProps) {
    if (products.length === 0) {
        return null;
    }
    return (
        <section
            id="similar-products"
            className="mt-8">
            <h2 className="mb-4 text-lg font-semibold text-neutral-900">
                Sản phẩm tương tự
            </h2>
            <ProductCarousel products={products} rows={1} />
        </section>
    );
}
