import {
  Module, type MiddlewareConsumer, type NestModule,
} from "@nestjs/common";
import { ServiceConfigModule } from "@app/config/service-config.module";
import { RequestIdMiddleware } from "@app/common";
import { validateCatalogEnv } from "./config/catalog-env";
import { PrismaModule } from "./database/prisma.module";
import { ProductsController } from "./products/products.controller";
import { ProductsService } from "./products/products.service";
import { CategoriesController } from "./categories/categories.controller";
import { CollectionsController } from "./collections/collections.controller";
import { CollectionsService } from "./collections/collections.service";
import { InventoryInternalController } from "./inventory/inventory.internal.controller";
import { InventoryService } from "./inventory/inventory.service";
import { ReservationExpiryService } from "./inventory/reservation-expiry.service";
import { ProductResolveController } from "./internal/product-resolve.controller";
import { InternalServiceGuard } from '@app/common';


@Module({
  imports: [
    ServiceConfigModule.forService("catalog-service", validateCatalogEnv),
    PrismaModule,
  ],
  controllers: [
    ProductsController, 
    CategoriesController, 
    CollectionsController,
    InventoryInternalController, 
    ProductResolveController,
  ],
  providers: [
    ProductsService, 
    CollectionsService, 
    InventoryService,
    ReservationExpiryService, 
    InternalServiceGuard,
  ],
})
export class CatalogServiceModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes("{*splat}");
  }
}