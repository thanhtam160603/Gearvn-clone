import { Module } from '@nestjs/common';
import { CartServiceController } from './cart-service.controller';
import { CartServiceService } from './cart-service.service';
import { BackendConfigModule } from '@app/config';

@Module({
  imports: [BackendConfigModule],
  controllers: [],
  providers: [],
})
export class CartServiceModule {}
