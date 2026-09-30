import { z } from "zod";
import { baseEnvSchema } from "@app/config/env";

export const cartEnvSchema = baseEnvSchema.safeExtend({
  SERVICE_NAME: z.literal("cart-service"),
  HTTP_HOST: z.string().min(1).default("127.0.0.1"),
  CART_DATABASE_URL: z.url(),
  CATALOG_SERVICE_URL: z.url(),
  JWT_PUBLIC_KEY: z.string().min(1),
  CART_COOKIE_SECRET: z.string().min(32),
  INTERNAL_SERVICE_KEY: z.string().min(32),
});
export type CartEnv = z.infer<typeof cartEnvSchema>;

export function validateCartEnv(raw: Record<string, unknown>): CartEnv {
  const result = cartEnvSchema.safeParse(raw);
  if (!result.success) {
    const fields = result.error.issues.map((issue) => issue.path.join("."));
    throw new Error("Cart env sai: " + [...new Set(fields)].join(", "));
  }
  return result.data;
}