import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CheckoutRunnerService } from './checkout-runner.service';
import { OrderCancellationService } from '../orders/order-cancellation.service';

@Injectable()
export class CheckoutRecoveryService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CheckoutRecoveryService.name);
  private timer?: ReturnType<typeof setInterval>;
  private active?: Promise<void>;
  private stopping = false;
  constructor(
    private readonly db: PrismaService,
    private readonly runner: CheckoutRunnerService,
    private readonly cancellations: OrderCancellationService,
  ) {}
  onModuleInit() {
    this.timer = setInterval(() => {
      if (this.stopping || this.active) return;
      this.active = this.tick()
        .catch((error: unknown) => {
          this.logger.error(
            'RECOVERY_TICK_FAILED',
            error instanceof Error ? error.stack ?? error.message : String(error),
          );
        })
        .finally(() => { this.active = undefined; });
    }, 5_000);
  }
  private async tick() {
    const now = new Date();
    const intents = await this.db.checkoutRequest.findMany({
      where: {
        needsAttention: false, nextAttemptAt: { lte: now },
        OR: [
          { status: { in: ['PROCESSING', 'ORDER_WRITTEN', 'COMPENSATION_PENDING'] } },
          { status: 'COMPLETED', cleanupStatus: 'PENDING' },
        ],
      },
      select: { id: true }, orderBy: [{ nextAttemptAt: 'asc' }, { id: 'asc' }], take: 20,
    });
    for (const row of intents) {
      if (this.stopping) return;
      await this.runner.run(row.id, 'recovery:' + row.id);
    }
    const orders = await this.db.order.findMany({
      where: {
        status: 'CANCELLATION_PENDING', cancellationNeedsAttention: false,
        cancellationRetryAt: { lte: now },
      },
      select: { id: true }, orderBy: [{ cancellationRetryAt: 'asc' }, { id: 'asc' }], take: 20,
    });
    for (const row of orders) {
      if (this.stopping) return;
      await this.cancellations.run(row.id, 'cancel-recovery:' + row.id);
    }
  }
  async onModuleDestroy() {
    this.stopping = true;
    if (this.timer) clearInterval(this.timer);
    // Chờ operation hiện tại; mỗi upstream call có timeout và runner có budget.
    await this.active;
  }
}
