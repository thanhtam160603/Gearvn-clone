import { Module } from '@nestjs/common';
import { AuthGatewayController } from './auth-gateway.controller';
import { IdentityProxyService } from './identity-proxy.service';
import { ProfileGatewayController } from './profile-gateway.controller';

@Module({
  controllers: [AuthGatewayController, ProfileGatewayController],
  providers: [IdentityProxyService],
})
export class IdentityGatewayModule {}
