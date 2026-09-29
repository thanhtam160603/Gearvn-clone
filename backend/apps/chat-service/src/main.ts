import { NestFactory } from '@nestjs/core';
import { ChatServiceModule } from './chat-service.module';

import { configureHttpApp } from "@app/common";
import type { BaseEnv } from "@app/config";
import { ConfigService } from "@nestjs/config";

async function bootstrap() {
  const app = await NestFactory.create(ChatServiceModule);
  const config = app.get(ConfigService<BaseEnv, true>);
  configureHttpApp(app, {
    frontendOrigin: config.get("FRONTEND_ORIGIN", { infer: true })
  });

  await app.listen(config.get("PORT", { infer: true }));

}
void bootstrap();
