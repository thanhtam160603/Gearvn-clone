import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { configureHttpApp } from "@app/common";
import type { BaseEnv } from "@app/config";

import { ApiGatewayModule } from "./api-gateway.module";
import { ChatWsAdapter } from './chat/chat-ws.adapter';

/** Khởi động HTTP API và WebSocket thuần trên cùng cổng của API Gateway. */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(ApiGatewayModule);
  const config = app.get(ConfigService<BaseEnv, true>);

  configureHttpApp(app, {
    frontendOrigin: config.get("FRONTEND_ORIGIN", { infer: true }),
    globalPrefix: "api",
  });
  app.useWebSocketAdapter(new ChatWsAdapter(
    app,
    config.get('FRONTEND_ORIGIN', { infer: true }),
  ));

  // Chỉ bật tài liệu tương tác khi phát triển; không công khai contract nội bộ ở production.
  if (config.get('NODE_ENV', { infer: true }) === 'development') {
    const documentConfig = new DocumentBuilder()
      .setTitle('GearVN Backend API')
      .setDescription('Các REST API công khai qua API Gateway')
      .setVersion('1.0')
      .addBearerAuth()
      .addCookieAuth('refreshToken')
      .build();
    SwaggerModule.setup(
      'docs',
      app,
      () => SwaggerModule.createDocument(app, documentConfig),
      { swaggerOptions: { withCredentials: true } },
    );
  }

  await app.listen(config.get("PORT", { infer: true }));
}

void bootstrap();
