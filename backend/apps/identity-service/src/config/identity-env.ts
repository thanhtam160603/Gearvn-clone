import { z } from "zod";
import { baseEnvSchema } from "@app/config/env";

export const identityEnvSchema = baseEnvSchema.safeExtend({
  SERVICE_NAME: z.literal("identity-service"),
  IDENTITY_DATABASE_URL: z.url(),
  JWT_PRIVATE_KEY: z.string().min(1),
  JWT_PUBLIC_KEY: z.string().min(1),
});

export type IdentityEnv = z.infer<typeof identityEnvSchema>;

export function validateIdentityEnv(raw: Record<string, unknown>): IdentityEnv {
  const result = identityEnvSchema.safeParse(raw);
  if (!result.success) {
    const fields = [...new Set(result.error.issues.map((issue) => issue.path.join(".")))];
    throw new Error(`Identity env không hợp lệ: ${fields.join(", ")}`);
  }
  return result.data;
}
