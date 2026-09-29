import { NestFactory } from '@nestjs/core';
import { IdentityServiceModule } from './identity-service.module';
import cookieParser from "cookie-parser";

import { configureHttpApp } from "@app/common";
import type { BaseEnv } from "@app/config";
import { ConfigService } from "@nestjs/config";

async function bootstrap() {
  const app = await NestFactory.create(IdentityServiceModule);
  const config = app.get(ConfigService<BaseEnv, true>);

  configureHttpApp(app, {
    frontendOrigin: config.get("FRONTEND_ORIGIN", { infer: true })
  });

  app.use(cookieParser());
  await app.listen(config.get("PORT", { infer: true }));
}
void bootstrap();
