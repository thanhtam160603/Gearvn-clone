import { z } from 'zod';
import { baseEnvSchema } from '@app/config/env';

const httpUrl = z.url().refine(
  value => ['http:', 'https:'].includes(new URL(value).protocol),
  'Phải là URL HTTP/HTTPS',
);

export const gatewayEnvSchema = baseEnvSchema.safeExtend({
  SERVICE_NAME: z.literal('api-gateway'),
  FRONTEND_ORIGIN: httpUrl,
  IDENTITY_SERVICE_URL: httpUrl,
  CATALOG_SERVICE_URL: httpUrl,
  CART_SERVICE_URL: httpUrl,
  ORDER_SERVICE_URL: httpUrl,
  CHAT_SERVICE_URL: httpUrl,
  JWT_PUBLIC_KEY: z.string().min(1),
  INTERNAL_SERVICE_KEY: z.string().min(32),
});

export type GatewayEnv = z.infer<typeof gatewayEnvSchema>;

export function validateGatewayEnv(raw: Record<string, unknown>): GatewayEnv {
  const result = gatewayEnvSchema.safeParse(raw);
  if (!result.success) {
    const fields = result.error.issues.map(issue => issue.path.join('.'));
    throw new Error(`Gateway env sai: ${[...new Set(fields)].join(', ')}`);
  }
  return result.data;
}