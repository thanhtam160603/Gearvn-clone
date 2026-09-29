import { NestFactory } from '@nestjs/core';
import { CatalogServiceModule } from './catalog-service.module';
import { ConfigService } from '@nestjs/config';
import { configureHttpApp } from '@app/common';
import type { CatalogEnv } from './config/catalog-env';
async function bootstrap() :Promise<void>{
  const app = await NestFactory.create(CatalogServiceModule);
  const config = app.get(ConfigService<CatalogEnv, true>);
  configureHttpApp(app, {
    frontendOrigin: config.get("FRONTEND_ORIGIN", { infer: true }),
  });
  app.enableShutdownHooks();
  await app.listen(
    config.get("PORT", { infer: true }),
    config.get("HTTP_HOST", { infer: true })
  )

}
void bootstrap();
