import { Module } from "@nestjs/common";
import { CartGatewayController } from "./cart-gateway.controller";
import { CartProxyService } from "./cart-proxy.service";

@Module({
  controllers: [CartGatewayController],
  providers: [CartProxyService],
})
export class CartGatewayModule {}