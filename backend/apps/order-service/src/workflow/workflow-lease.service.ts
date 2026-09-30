import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../database/prisma.service';
import { LeaseLost, prismaCode } from './workflow.util';

@Injectable()
export class WorkflowLeaseService {
  constructor(private readonly db: PrismaService) {}
  async acquire(key: string): Promise<string | null> {
    const owner = randomUUID();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30_000);
    const claimed = await this.db.workflowLease.updateMany({
      where: { key, expiresAt: { lte: now } }, data: { owner, expiresAt },
    });
    if (claimed.count === 1) return owner;
    try {
      await this.db.workflowLease.create({ data: { key, owner, expiresAt } });
      return owner;
    } catch (error) {
      if (prismaCode(error, 'P2002')) return null;
      throw error;
    }
  }
  async assertOwned(tx: Prisma.TransactionClient, key: string, owner: string) {
    const now = new Date();
    const changed = await tx.workflowLease.updateMany({
      where: { key, owner, expiresAt: { gt: now } },
      data: { expiresAt: new Date(now.getTime() + 30_000) },
    });
    if (changed.count !== 1) throw new LeaseLost();
  }
  async renew(key: string, owner: string) {
    await this.assertOwned(this.db, key, owner);
  }
  async release(key: string, owner: string) {
    await this.db.workflowLease.deleteMany({ where: { key, owner } });
  }
}