import { MiddlewareConsumer, Module, type NestModule } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";

import { RequestIdMiddleware } from "@app/common";
import { ServiceConfigModule } from "@app/config/service-config.module";
import { CatalogGatewayModule } from "./catalog/catalog-gateway.module";

@Module({
  imports: [
    ServiceConfigModule.forService("api-gateway"), // cung cấp cấu hình cho api-gateway
    CatalogGatewayModule,
    // cấu hình giới hạn tần suất request
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 120,
      },
    ]),
  ],
  controllers: [

  ],

  // áp dụng ThrottlerGuard cho toàn bộ ứng dụng để giới hạn tần suất request
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})


export class ApiGatewayModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes("{*splat}");
  }
}

