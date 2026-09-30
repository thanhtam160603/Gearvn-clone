import { z } from 'zod';
import { baseEnvSchema } from '@app/config/env';

const httpUrl = z.url().refine(value => {
    const protocol = new URL(value).protocol;
    return protocol === 'http:' || protocol === 'https:';
}, 'URL phải dùng HTTP/HTTPS');

export const orderEnvSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    SERVICE_NAME: z.literal('order-service'),
    PORT: z.coerce.number().int().min(1024).max(65535).default(4004),
    HTTP_HOST: z.string().min(1).default('127.0.0.1'),
    FRONTEND_ORIGIN: httpUrl,
    ORDER_DATABASE_URL: z.url(),
    CART_SERVICE_URL: httpUrl,
    CATALOG_SERVICE_URL: httpUrl,
    JWT_PUBLIC_KEY: z.string().min(1),
    INTERNAL_SERVICE_KEY: z.string().min(32),
});
export type OrderEnv = z.infer<typeof orderEnvSchema>;
export function validateOrderEnv(raw: Record<string, unknown>): OrderEnv {
    const parsed = orderEnvSchema.safeParse(raw);
    if (!parsed.success) {
      const fields = parsed.error.issues.map(i => i.path.join('.'));
      throw new Error('Order env sai: ' + [...new Set(fields)].join(', '));
    }
    return parsed.data;
}