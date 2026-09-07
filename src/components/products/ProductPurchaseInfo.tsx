"use client";

import Image from "next/image";
import type { Product } from "@/types/product";
import { formatPrice } from "@/lib/format-price";
import { MdAddShoppingCart } from "react-icons/md";
import { addItem, openDrawer } from "@/store/cart-slice";
import { useAppDispatch } from "@/hooks/redux-hooks";

type ProductPurchaseInfoProps = {
  product: Product;
};

export default function ProductPurchaseInfo({ product }: ProductPurchaseInfoProps) {
  const dispatch = useAppDispatch();
  
  const hasOriginalPrice =
    typeof product.originalPrice === "number" &&
    product.originalPrice > product.salePrice;
  const bundles = product.bundles ?? [];
  
  const handleAddToCart = () => {
    if (product.stockQuantity <= 0) return;
    dispatch(
      addItem({
        productId: product.id,
        stockQuantity: product.stockQuantity,
      })
    );
    dispatch(openDrawer());
  }

  return (
    <section
      id="product-purchase-info"
      className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
    >
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {product.brand}
      </p>

      <h1 className="mt-2 text-xl font-bold leading-7 text-gray-900 md:text-2xl">
        {product.name}
      </h1>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500">
        <span>Mã sản phẩm: {product.sku}</span>
        {typeof product.rating === "number" && (
          <span className="text-amber-500">
            ★ {product.rating.toFixed(1)} ({product.reviewCount ?? 0} đánh giá)
          </span>
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-end gap-3">
        <p className="text-3xl font-bold text-[var(--gearvn-red)]">
          {formatPrice(product.salePrice)}
        </p>
        {hasOriginalPrice && (
          <p className="pb-1 text-sm text-gray-400 line-through">
            {formatPrice(product.originalPrice!)}
          </p>
        )}
        {product.discount && product.discount > 0 && (
          <span className="mb-1 rounded bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">
            -{product.discount}%
          </span>
        )}
      </div>

      {product.promotion && (
        <div className="mt-5 rounded-lg border border-red-100 bg-red-50 p-3">
          <p className="text-sm font-semibold text-red-700">Ưu đãi đi kèm</p>
          <p className="mt-1 text-sm leading-5 text-red-800">{product.promotion}</p>
        </div>
      )}

      {bundles.length > 0 && (
        <div className="mt-5 rounded-lg border border-gray-200 p-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-gray-900">Mua kèm giá sốc</h2>
          </div>

          <div className="mt-3 grid gap-3 ">
            {bundles.slice(0, 2).map((bundle) => (
              <article key={bundle.id} className="flex gap-3 rounded-lg bg-gray-50 p-2">
                <div className="relative size-16 shrink-0 overflow-hidden rounded bg-white">
                  <Image
                    src={bundle.image}
                    alt={bundle.name}
                    fill
                    sizes="64px"
                    className="object-contain"
                  />
                </div>
                <div className="min-w-0">
                  <h3 className="line-clamp-2 text-xs font-medium text-gray-800">
                    {bundle.name}
                  </h3>
                  <p className="mt-1 text-sm font-bold text-[var(--gearvn-red)]">
                    {formatPrice(bundle.salePrice)}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      <div className="mt-5 xl:flex grid gap-2 sm:grid-cols-3">
        <button
          type="button"
          className="rounded-lg xl:flex flex-1 flex-col items-center justify-center bg-[var(--gearvn-red)] px-2 py-1 text-sm font-bold text-white transition hover:brightness-95"
        >
          <span className="text-sm font-bold leading-[20px] leading-5">
            Mua ngay
          </span>
          <span className=" text-xs font-semibold whitespace-nowrap leading-3">
            Giao tận nơi/Nhận tại cửa hàng
          </span>
        </button>
        <button
          type="button"
          className="rounded-lg xl:flex flex-1 flex-col items-center justify-center border border-[var(--gearvn-red)] px-2 py-1 text-sm font-bold text-[var(--gearvn-red)] transition hover:bg-red-50"
        >
          <span className="text-sm font-bold leading-[20px] leading-5">
            Tư vấn ngay
          </span>
          <span className=" text-xs font-semibold whitespace-nowrap leading-3">
            Gợi ý theo nhu cầu
          </span>
        </button>
        <button
          type="button"
          className="relative rounded-lg xl:flex items-center justify-center bg-gray-100 px-4 py-3 text-sm font-bold text-gray-800 transition hover:bg-gray-200"
          onClick={handleAddToCart}
        >
          <MdAddShoppingCart className="inline-block size-8" />
        </button>
      </div>

      {product.warranty && (
        <p className="mt-4 text-xs leading-5 text-gray-500">{product.warranty}</p>
      )}
    </section>
  );
}
