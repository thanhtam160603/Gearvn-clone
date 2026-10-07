import AppFooter from "@/components/common/AppFooter";
import AppHeader from "@/components/common/AppHeader";
import HeroSection from "@/components/home/HeroSection";
import HomepageProductSections from "@/components/products/HomepageProductSections";
import PromoStrip from "@/components/home/PromoStrip";
import { productSectionConfigs } from "@/data/product-section-configs";
import { getCategories, listProducts } from "@/lib/api/catalog";

export const dynamic = "force-dynamic";

export default async function Home() {
  const categories = await getCategories();
  const available = new Set(categories.map(({ slug }) => slug));
  const sections = await Promise.all(
    productSectionConfigs
      .filter(({ id }) => available.has(id))
      .map(async (config) => ({
        config,
        products: (await listProducts({ section: config.id, pageSize: 20 })).items,
      })),
  );
  return (
    <div className="flex min-h-screen flex-col overflow-x-clip">
      <AppHeader />
      <main className="flex-1 bg-[var(--background)] pb-5">
        <HeroSection />
        <PromoStrip />
        <HomepageProductSections sections={sections} />
      </main>
      <AppFooter />
    </div>
  );
}
