import { Module } from "@nestjs/common";
import { ConfigModule as NestConfigModule } from "@nestjs/config";

import { validateBaseEnv } from "./env";
//đọc các biến môi trường từ file .env và validate chúng
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateBaseEnv,
    }),
  ],
  exports: [NestConfigModule],
})
export class BackendConfigModule {}
