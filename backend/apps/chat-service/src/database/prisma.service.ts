import { Injectable, OnModuleDestroy, OnModuleInit, type OnApplicationShutdown } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import type { ChatEnv } from "../config/chat-env";


@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(config: ConfigService<ChatEnv, true>) {
    super({ adapter: new PrismaPg({
      connectionString: config.get('CHAT_DATABASE_URL', { infer: true }),
    }) });
  }
  async onModuleInit() { await this.$connect(); }
  async onModuleDestroy() { await this.$disconnect(); }
}