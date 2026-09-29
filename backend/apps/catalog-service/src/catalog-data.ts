import { z } from "zod";

export const attributeKeys = [
  "cpu", "gpu", "vga", "ram", "ssd", "mainboard", "screen", "size", "panel",
  "resolution", "refreshRate", "backlight", "connection", "dpi", "weight",
  "feature", "layout", "productType", "color", "caseSize", "motherboardSupport",
  "wattage", "efficiency", "modular", "coolerType", "radiatorSize",
  "socketSupport", "cpuBrand", "socket", "chipset", "ramType", "formFactor",
  "wifi", "memorySlots", "capacity", "interface", "protocol", "useCase",
] as const;

export function normalize(value: string): string {
  return value.trim().toLocaleLowerCase("vi");
}

export const stringsSchema = z.array(z.string());
export const specSchema = z.object({ label: z.string(), value: z.string() });
export const variantsSchema = z.array(z.object({
  id: z.string(), label: z.string(), value: z.string(),
  priceDifference: z.number().optional(),
}));
export const bundlesSchema = z.array(z.object({
  id: z.string(), name: z.string(), image: z.string(),
  originalPrice: z.number().int().nonnegative(),
  salePrice: z.number().int().nonnegative(),
}));
export const contentSchema = z.array(z.object({
  id: z.string(), title: z.string(), paragraphs: stringsSchema,
  images: stringsSchema.optional(),
}));
export const filterDefinitionSchema = z.object({
  id: z.string().min(1), label: z.string(),
  source: z.enum(["price", "brand", ...attributeKeys]),
  type: z.enum(["checkbox", "price-range"]),
});
export const filterDefinitionsSchema = z.array(filterDefinitionSchema);
export type FilterDefinition = z.infer<typeof filterDefinitionSchema>;

export const fixtureProductSchema = z.object({
  id: z.string().min(1), sku: z.string().min(1), slug: z.string().min(1),
  section: z.string().min(1), name: z.string().min(1), brand: z.string().min(1),
  image: z.string(), images: stringsSchema,
  salePrice: z.number().int().nonnegative().max(2_147_483_647),
  originalPrice: z.number().int().nonnegative().max(2_147_483_647).optional(),
  stockQuantity: z.number().int().nonnegative(),
  status: z.enum(["in-stock", "out-of-stock", "pre-order"]),
  description: z.string().optional(), shortDescription: z.string().optional(),
  tags: stringsSchema.default([]), highlights: stringsSchema.default([]),
  featuredSpecs: z.array(specSchema).default([]),
  specificationGroups: z.array(z.object({
    title: z.string(), items: z.array(specSchema),
  })).default([]),
  filterAttributes: z.record(z.string(), stringsSchema).default({}),
  variants: variantsSchema.default([]), bundles: bundlesSchema.default([]),
  contentSections: contentSchema.default([]),
  warranty: z.string().optional(), promotion: z.string().optional(),
  rating: z.number().optional(), reviewCount: z.number().int().nonnegative().default(0),
});

export const fixtureSchema = z.object({
  products: z.array(fixtureProductSchema),
  sections: z.array(z.object({ id: z.string(), title: z.string() })),
  collections: z.array(z.object({
    slug: z.string(), title: z.string(), breadcrumbLabel: z.string(),
    description: z.string(), sections: stringsSchema,
    filters: filterDefinitionsSchema,
    banner: z.object({ src: z.string(), alt: z.string() }).optional(),
  })),
});
export type FixtureProduct = z.infer<typeof fixtureProductSchema>;