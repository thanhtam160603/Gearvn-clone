import { Module } from '@nestjs/common';
import { OrderServiceController } from './order-service.controller';
import { OrderServiceService } from './order-service.service';
import { BackendConfigModule } from '@app/config';
@Module({
  imports: [BackendConfigModule],
  controllers: [],
  providers: [],
})
export class OrderServiceModule {}
