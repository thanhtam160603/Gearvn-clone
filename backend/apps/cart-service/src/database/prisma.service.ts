import { Injectable, type OnModuleInit, type OnApplicationShutdown } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import type { CartEnv } from "../config/cart-env";

@Injectable()
export class PrismaService extends PrismaClient
  implements OnModuleInit, OnApplicationShutdown {
  constructor(config: ConfigService<CartEnv, true>) {
    super({
      adapter: new PrismaPg({
        connectionString: config.get("CART_DATABASE_URL", { infer: true }),
      }),
    });
  }

  async onModuleInit(): Promise<void> { await this.$connect(); }
  async onApplicationShutdown(): Promise<void> { await this.$disconnect(); }
}