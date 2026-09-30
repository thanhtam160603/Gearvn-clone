import { NestFactory } from '@nestjs/core';
import { CartServiceModule } from './cart-service.module';
import { configureHttpApp } from "@app/common";
import { ConfigService } from "@nestjs/config";
import type { CartEnv } from "./config/cart-env";

async function bootstrap() {
  const app = await NestFactory.create(CartServiceModule);
  const config = app.get(ConfigService<CartEnv, true>);

  configureHttpApp(app, {
    frontendOrigin: config.get("FRONTEND_ORIGIN", { infer: true })
  });
  app.enableShutdownHooks();
  await app.listen(
      config.get("PORT", { infer: true }),
      config.get("HTTP_HOST", { infer: true })
    );
}
void bootstrap();
