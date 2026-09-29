import { Module, type DynamicModule } from "@nestjs/common";
import { ConfigModule as NestConfigModule } from "@nestjs/config";
import { resolve } from "node:path";

import { type BaseEnv, validateBaseEnv } from "./env";

export type BackendServiceName =
  | "api-gateway"
  | "identity-service"
  | "catalog-service"
  | "cart-service"
  | "order-service"
  | "chat-service";

type EnvValidator = (raw: Record<string, unknown>) => BaseEnv;

@Module({})
export class ServiceConfigModule {
  static forService(
    serviceName: BackendServiceName,
    validator: EnvValidator = validateBaseEnv,
  ): DynamicModule {
    return {
      module: ServiceConfigModule,
      imports: [
        NestConfigModule.forRoot({
          envFilePath: resolve(process.cwd(), "apps", serviceName, ".env"),
          isGlobal: true,
          cache: true,
          validate(raw) {
            const parsed = validator(raw);
            if (parsed.SERVICE_NAME !== serviceName) {
              throw new Error(`SERVICE_NAME không khớp ${serviceName}`);
            }
            return parsed;
          },
        }),
      ],
      exports: [NestConfigModule],
    };
  }
}
