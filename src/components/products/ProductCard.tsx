import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/types/product";
import { formatPrice } from "@/lib/format-price";

type ProductCardProps = {
  product: Product;
};

export default function ProductCard({ product }: ProductCardProps) {
  const hasOriginalPrice =
    typeof product.originalPrice === "number" &&
    product.originalPrice > product.salePrice;
  const hasDiscount = typeof product.discount === "number" && product.discount > 0;

  return (
    <article className="group flex h-full min-w-0 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white transition duration-200 hover:-translate-y-0.5 hover:border-red-200 hover:shadow-lg">
      <Link
        href={`/product/${product.slug}`}
        aria-label={`Xem sản phẩm ${product.name}`}
        className="flex h-full flex-col"
      >
        <div className="relative aspect-square overflow-hidden bg-white p-4">
          {hasDiscount && (
            <span className="absolute left-3 top-3 z-10 rounded-md bg-[var(--gearvn-red)] px-2 py-1 text-xs font-bold text-white">
              -{product.discount}%
            </span>
          )}
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 639px) 46vw, (max-width: 1023px) 32vw, 220px"
            className="object-contain p-3 transition duration-300 group-hover:scale-105"
          />
        </div>

        <div className="flex flex-1 flex-col p-3 pt-0">
          <p className="mb-1 text-xs font-medium text-gray-500">{product.brand}</p>
          <h3 className="line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-gray-900 group-hover:text-[var(--gearvn-red)]">
            {product.name}
          </h3>

          {product.highlights && product.highlights.length > 0 && (
            <div className="mt-2 flex min-h-12 flex-wrap content-start gap-1">
              {product.highlights.slice(0, 4).map((highlight) => (
                <span
                  key={highlight}
                  className="rounded bg-gray-100 px-1.5 py-1 text-[10px] leading-3 text-gray-600"
                >
                  {highlight}
                </span>
              ))}
            </div>
          )}

          <div className="mt-auto pt-3">
            {hasOriginalPrice && (
              <p className="text-xs text-gray-400 line-through">
                {formatPrice(product.originalPrice!)}
              </p>
            )}
            <p className="text-lg font-bold text-[var(--gearvn-red)]">
              {formatPrice(product.salePrice)}
            </p>
          </div>

          {product.promotion && (
            <p className="mt-2 line-clamp-2 rounded-md bg-red-50 px-2 py-1.5 text-[11px] leading-4 text-red-700">
              {product.promotion}
            </p>
          )}
        </div>
      </Link>
    </article>
  );
}
