import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../database/prisma.service';
import { transaction } from '../workflow/workflow.util';
import { ListOrdersDto } from './dto/list-orders.dto';
import { orderInclude, toOrderView } from './order-view';

@Injectable()
export class OrdersService {
    constructor(private readonly db: PrismaService) {}
    async list(userId: string, dto: ListOrdersDto) {
        const where: Prisma.OrderWhereInput = { 
            userId,
            placedAt: { not: null },
            ...(dto.status ? { status: dto.status } : {}),

        };
        return transaction(this.db, async (tx) => {
            const totalItems = await tx.order.count({ where });
            const rows = await tx.order.findMany({
                where,
                include: orderInclude,
                orderBy: [
                    { createdAt: 'desc' },
                    { id: 'desc' },
                ],
                skip: (dto.page - 1) * dto.pageSize,
                take: dto.pageSize,
            });
            return {
                items: rows.map(toOrderView),
                page: dto.page,
                pageSize: dto.pageSize,
                totalItems,
                totalPages: Math.ceil(totalItems / dto.pageSize),
            }
        });
    }
    async detail(userId: string, orderId: string) {
        const row = await this.db.order.findFirst({
            where: {
                id: orderId,
                userId,
                placedAt: { not: null },
            },
            include: orderInclude,
        })
        if (!row) throw new NotFoundException();
        return toOrderView(row);
    }
}
