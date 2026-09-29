import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { products, productSectionConfigs } from "../../../../src/data/products";
import { categoryConfigs } from "../../../../src/data/category-configs";
import { fixtureSchema } from "../src/catalog-data";

async function main(): Promise<void> {
  const fixture = fixtureSchema.parse({
    products,
    sections: productSectionConfigs.map(({ id, title }) => ({ id, title })),
    collections: categoryConfigs,
  });
  const path = resolve("apps/catalog-service/prisma/catalog-fixture.json");
  await writeFile(path, JSON.stringify(fixture, null, 2) + "\n", "utf8");
  console.log("Exported", fixture.products.length, "products;",
    fixture.collections.length, "collections");
}
void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});

