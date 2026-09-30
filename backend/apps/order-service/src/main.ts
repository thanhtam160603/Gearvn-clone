import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { configureHttpApp } from '@app/common';
import { OrderServiceModule } from './order-service.module';
import type { OrderEnv } from './config/order-env';

async function bootstrap() {
  const app = await NestFactory.create(OrderServiceModule);
  const config = app.get(ConfigService<OrderEnv, true>);
  configureHttpApp(app, {
    frontendOrigin: config.get("FRONTEND_ORIGIN", { infer: true }),
  });
  app.enableShutdownHooks();
  await app.listen(
    config.get('PORT', { infer: true }),
    config.get('HTTP_HOST', { infer: true }),
  );
}
void bootstrap();