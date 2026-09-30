import { Module, MiddlewareConsumer, type NestModule } from '@nestjs/common';
import { CartServiceController } from './cart-service.controller';
import { CartServiceService } from './cart-service.service';
import { ServiceConfigModule } from "@app/config/service-config.module";
import { validateCartEnv } from "./config/cart-env";
import { PrismaModule } from "./database/prisma.module";
import { JwtModule } from "@nestjs/jwt";
import { CartOwnerService } from "./cart/cart-owner.service";
import { CatalogClientService } from "./cart/catalog-client.service";
import { CartService } from "./cart/cart.service";
import { CartViewService } from "./cart/cart-view.service";
import { CartController } from "./cart/cart.controller";
import { RequestIdMiddleware } from '@app/common/http/request-id.middleware';
import { CartCheckoutService } from './cart/cart-checkout.service';
import { CartCheckoutInternalController } from './cart/cart-checkout.internal.controller';
import { InternalServiceGuard } from '@app/common';
@Module({
  imports: [ ServiceConfigModule.forService("cart-service", validateCartEnv), PrismaModule, JwtModule.register({}) ],
  controllers: [CartController, CartCheckoutInternalController],
  providers: [
    CartServiceController, CartServiceService, CartOwnerService, CatalogClientService, CartService, CartViewService, CartCheckoutService, InternalServiceGuard
  ],
})
export class CartServiceModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes("{*splat}");
  }
}
