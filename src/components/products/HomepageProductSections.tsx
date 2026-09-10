import { products, productSectionConfigs } from "@/data/products";
import ProductSection from "./ProductSection";
import PromoStrip1 from "../home/PromoStrip1";

export default function HomepageProductSections() {
  return (
    <div className="container-shell space-y-5 pb-8">
      {productSectionConfigs.map((config) => (
        <div key={config.id} className="space-y-5">
          {config.id === "monitor" && (
            <PromoStrip1 />
          )}

          <ProductSection
            title={config.title}
            tabs={config.tabs}
            products={products.filter(
              (product) => product.section === config.id
            )}
            rows={config.rows}
            viewAllHref={config.viewAllHref}
          />
        </div>
      ))}
    </div>
  );
}
