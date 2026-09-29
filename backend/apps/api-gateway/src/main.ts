import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";

import { configureHttpApp } from "@app/common";
import type { BaseEnv } from "@app/config";

import { ApiGatewayModule } from "./api-gateway.module";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(ApiGatewayModule);
  const config = app.get(ConfigService<BaseEnv, true>);

  configureHttpApp(app, {
    frontendOrigin: config.get("FRONTEND_ORIGIN", { infer: true }),
    globalPrefix: "api",
  });

  await app.listen(config.get("PORT", { infer: true }));
}

void bootstrap();
