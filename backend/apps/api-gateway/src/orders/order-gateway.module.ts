import { Module } from '@nestjs/common';
import { OrderProxyService } from './order-proxy.service';
import { OrderGatewayController } from './order-gateway.controller';
import { WarrantyGatewayController } from './warranty-gateway.controller';
import { SupportOrderGatewayController } from './support-order-gateway.controller';

@Module({
  controllers: [
    OrderGatewayController, WarrantyGatewayController, SupportOrderGatewayController,
  ],
  providers: [OrderProxyService],
})
export class OrderGatewayModule {}