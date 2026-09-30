import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import { defineConfig, env } from 'prisma/config';

const serviceDir = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(serviceDir, '.env'), override: true, quiet: true });
export default defineConfig({
  schema: resolve(serviceDir, 'prisma/schema.prisma'),
  migrations: { path: resolve(serviceDir, 'prisma/migrations') },
  datasource: { url: env('ORDER_DATABASE_URL')},
});