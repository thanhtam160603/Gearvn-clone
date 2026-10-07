import { notFound } from "next/navigation";
import { getProduct, listProducts } from "@/lib/api/catalog";
import { ApiError } from "@/lib/api/client";
import ProductGallery from "@/components/products/ProductGallery";
import ProductPurchaseInfo from "@/components/products/ProductPurchaseInfo";
import Breadcrumb from "@/components/products/Breadcrumb";
import SimilarProducts from "@/components/products/SimilarProducts";
import AppHeader from "@/components/common/AppHeader";
import AppFooter from "@/components/common/AppFooter";
import ProductInformation from "@/components/products/ProductInformation";
import ProductRecentlyViewed from "@/components/products/ProductRecentlyViewed";
import StickyProductBar from "@/components/products/StickyProductBar";

type PageProps = {
    params: Promise<{
        slug: string;
    }>;
};

export default async function ProductDetailPage({
    params,
}: PageProps) {
    const { slug } = await params;

    const product = await getProduct(slug).catch((error: unknown) => {
        if (error instanceof ApiError && error.status === 404) notFound();
        throw error;
    });
    const sameSection = await listProducts({ section: product.section, pageSize: 20 });
    const similarProducts = sameSection.items.filter((item) => item.id !== product.id);

    return (
        <>
            <AppHeader />
            <main className="container-shell pb-24 pt-6 md:pb-0">
                <Breadcrumb section={product.section} productName={product.name} />

                <div className="grid gap-8 xl:grid-cols-[661px_minmax(0,1fr)]">
                    <ProductGallery
                        images={product.images}
                        alt={product.name}
                        features={product.featuredSpecs ?? []}
                    />

                    <ProductPurchaseInfo product={product} />
                </div>
                <SimilarProducts products={similarProducts ?? []} />
                <ProductInformation product={product} />
                <ProductRecentlyViewed
                    currentProductId={product.id}
                    products={similarProducts}
                />
            </main>
            <AppFooter />
            <StickyProductBar product={product} />
        </>
    );
}
