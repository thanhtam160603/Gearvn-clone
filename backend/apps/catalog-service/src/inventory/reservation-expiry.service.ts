import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit, } from "@nestjs/common";
import { InventoryService } from "./inventory.service";

@Injectable()
export class ReservationExpiryService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(ReservationExpiryService.name);
    private timer?: ReturnType<typeof setInterval>;
    private current?: Promise<void>;

    constructor(private readonly inventoryService: InventoryService) {}

    onModuleInit(): void {
        this.tick();
        this.timer = setInterval(() => this.tick(), 60_000);
        this.timer.unref();
    }

    private tick(): void {
    if (this.current) return;
    this.current = this.inventoryService.expireDue()
      .catch((error: unknown) => {
        this.logger.error("Không giải phóng được reservation hết hạn",
          error instanceof Error ? error.stack : undefined);
      })
      .finally(() => { this.current = undefined; });
    }

    async onModuleDestroy(): Promise<void> {
        if (this.timer) clearInterval(this.timer);
        await this.current;
    }
}