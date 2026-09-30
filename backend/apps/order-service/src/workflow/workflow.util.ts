import { z } from 'zod';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../database/prisma.service';
import { UpstreamError } from '../clients/internal-http.client';

export class LeaseLost extends Error {}
export class BudgetReached extends Error {}
export class AttentionError extends Error {
    constructor(readonly code: string) { super(code); }
}
export function prismaCode(error: unknown, code: string) {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;
}
export function failureCode(error: unknown): string {
    if (error instanceof AttentionError || error instanceof UpstreamError) return error.code;
    if (error instanceof z.ZodError) return 'SNAPSHOT_CONTRACT';
    if (error instanceof BudgetReached) return 'WORK_PENDING';
    if (error instanceof Prisma.PrismaClientKnownRequestError) return error.code;
    return 'WORKFLOW_ERROR';
}
export function needsAttention(error: unknown) {
    return error instanceof AttentionError || error instanceof z.ZodError ||
        (error instanceof UpstreamError &&
        ([400, 401, 403, 404].includes(error.upstreamStatus) ||
        ['DEPENDENCY_CONTRACT', 'IDEMPOTENCY_CONFLICT'].includes(error.code)));
}
export function nextRetry(attempt: number) {
    const ms = attempt <= 1 ? 5_000 : attempt === 2 ? 15_000 : attempt === 3 ? 60_000 : 300_000;
    return new Date(Date.now() + ms);
}
export async function transaction<T>(
    db: PrismaService, fn: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
    for (let attempt = 0; attempt < 3; attempt++) {
        try {
            return await db.$transaction(fn, {
                isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
                maxWait: 5_000, timeout: 5_000,
        });
        } catch (error) {
            if (!prismaCode(error, 'P2034') || attempt === 2) throw error;
        }
    }
    throw new Error('Transaction retry exhausted');
}