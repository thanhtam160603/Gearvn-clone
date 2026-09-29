import { Module } from "@nestjs/common";
import { CatalogGatewayController } from "./catalog-gateway.controller";
import { CatalogProxyService } from "./catalog-proxy.service";

@Module({
  controllers: [CatalogGatewayController],
  providers: [CatalogProxyService],
})
export class CatalogGatewayModule {}