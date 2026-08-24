import AppFooter from "@/components/AppFooter";
import AppHeader from "@/components/AppHeader";
import HeroSection from "@/components/HeroSection";
import HomepageProductSections from "@/components/products/HomepageProductSections";
import PromoStrip from "@/components/PromoStrip";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col overflow-x-clip">
      <AppHeader />
      <main className="flex-1 bg-[var(--background)] pb-5">
        <HeroSection />
        <PromoStrip />
        <HomepageProductSections />
      </main>
      <AppFooter />
    </div>
  );
}
