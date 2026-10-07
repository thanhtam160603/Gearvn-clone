import type { ProductSectionConfig, ProductSummary } from "@/types/product";
import ProductSection from "./ProductSection";
import PromoStrip1 from "../home/PromoStrip1";

type HomepageSection = {
  config: ProductSectionConfig;
  products: ProductSummary[];
};

export default function HomepageProductSections({ sections }: { sections: HomepageSection[] }) {
  return (
    <div className="container-shell space-y-5 pb-8">
      {sections.map(({ config, products }) => (
        <div key={config.id} className="space-y-5">
          {config.id === "monitor" && (
            <PromoStrip1 />
          )}

          <ProductSection
            title={config.title}
            tabs={config.tabs}
            products={products}
            rows={config.rows}
            viewAllHref={config.viewAllHref}
          />
        </div>
      ))}
    </div>
  );
}
