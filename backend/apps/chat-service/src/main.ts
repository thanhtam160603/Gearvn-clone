import { NestFactory } from '@nestjs/core';
import { ChatServiceModule } from './chat-service.module';

import { configureHttpApp } from "@app/common";
import type { ChatEnv } from './config/chat-env';
import { ConfigService } from "@nestjs/config";

async function bootstrap() {
  const app = await NestFactory.create(ChatServiceModule);
  const config = app.get(ConfigService<ChatEnv, true>);
  configureHttpApp(app, {
    frontendOrigin: config.get("FRONTEND_ORIGIN", { infer: true })
  });

  app.enableShutdownHooks();
  await app.listen(
    config.get('PORT', { infer: true }),
    config.get('HTTP_HOST', { infer: true }),
  );

}
void bootstrap();
