import { Injectable, type OnApplicationShutdown, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnApplicationShutdown {
    constructor(config: ConfigService) {
        super({
            adapter: new PrismaPg({
                connectionString: config.getOrThrow<string>("CATALOG_DATABASE_URL")
            })
        })
    }
    async onModuleInit(): Promise<void> {
        await this.$connect();
    }
    async onApplicationShutdown(signal?: string): Promise<void> {
        await this.$disconnect();
    }
}