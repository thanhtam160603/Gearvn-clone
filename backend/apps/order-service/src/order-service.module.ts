import { Module, type MiddlewareConsumer, type NestModule } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { RequestIdMiddleware } from '@app/common';
import { ServiceConfigModule } from '@app/config/service-config.module';
import { validateOrderEnv } from './config/order-env';
import { PrismaModule } from './database/prisma.module';
import { OrderAccessGuard } from './auth/order-access.guard';
import { CustomerRoleGuard } from './auth/customer-role.guard';
import { SupportRoleGuard } from './auth/support-role.guard';
import { InternalHttpClient } from './clients/internal-http.client';
import { CartClientService } from './clients/cart-client.service';
import { CatalogClientService } from './clients/catalog-client.service';
import { WorkflowLeaseService } from './workflow/workflow-lease.service';
import { CheckoutController } from './checkout/checkout.controller';
import { CheckoutService } from './checkout/checkout.service';
import { CheckoutRunnerService } from './checkout/checkout-runner.service';
import { CheckoutRecoveryService } from './checkout/checkout-recovery.service';
import { OrdersController } from './orders/orders.controller';
import { OrdersService } from './orders/orders.service';
import { OrderStatusService } from './orders/order-status.service';
import { OrderCancellationService } from './orders/order-cancellation.service';
import { SupportOrdersController } from './orders/support-orders.controller';
import { WarrantyService } from './warranty/warranty.service';
import { WarrantyController } from './warranty/warranty.controller';
import { SupportWarrantyController } from './warranty/support-warranty.controller';

@Module({
  imports: [
    ServiceConfigModule.forService('order-service', validateOrderEnv),
    PrismaModule, JwtModule.register({}),
  ],
  controllers: [
    CheckoutController, OrdersController, SupportOrdersController,
    WarrantyController, SupportWarrantyController,
  ],
  providers: [
    OrderAccessGuard, CustomerRoleGuard, SupportRoleGuard,
    InternalHttpClient, CartClientService, CatalogClientService,
    WorkflowLeaseService, CheckoutService, CheckoutRunnerService, CheckoutRecoveryService,
    OrdersService, OrderStatusService, OrderCancellationService, WarrantyService,
  ],
})
export class OrderServiceModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('{*splat}');
  }
}