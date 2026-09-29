import { z } from "zod";

export const catalogEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  SERVICE_NAME: z.literal("catalog-service"),
  PORT: z.coerce.number().int().min(1024).max(65535),
  HTTP_HOST: z.string().min(1).default("127.0.0.1"),
  FRONTEND_ORIGIN: z.url(),
  CATALOG_DATABASE_URL: z.url(),
});

export type CatalogEnv = z.infer<typeof catalogEnvSchema>;

export function validateCatalogEnv(raw: Record<string, unknown>): CatalogEnv {
  const result = catalogEnvSchema.safeParse(raw);
  if (!result.success) {
    // Chỉ in tên trường; không in raw env có thể chứa credential.
    const fields = result.error.issues.map((issue) => issue.path.join("."));
    throw new Error("Catalog env không hợp lệ: " + [...new Set(fields)].join(", "));
  }
  return result.data;
}