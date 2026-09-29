import { Module } from '@nestjs/common';
import { ChatServiceController } from './chat-service.controller';
import { ChatServiceService } from './chat-service.service';
import { BackendConfigModule } from '@app/config';
@Module({
  imports: [BackendConfigModule],
  controllers: [],
  providers: [],
})
export class ChatServiceModule {}
