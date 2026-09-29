import { z } from 'zod';
 // cấu hình các biến môi trường cơ bản mà tất cả các service cần
export const baseEnvSchema = z
    .looseObject({
        NODE_ENV: z
            .enum(['development', 'production', 'test'])
            .default('development'),
        SERVICE_NAME: z.string().trim().min(1),
        PORT: z.coerce.number().int().min(1024).max(65535),
        FRONTEND_ORIGIN: z.url(),
    })
export type BaseEnv = z.infer<typeof baseEnvSchema>;

export function validateBaseEnv(raw: Record<string, unknown>): BaseEnv {
  const result = baseEnvSchema.safeParse(raw);

  if (!result.success) {
    throw new Error(`Invalid environment: ${result.error.message}`);
  }

  return result.data;
}
