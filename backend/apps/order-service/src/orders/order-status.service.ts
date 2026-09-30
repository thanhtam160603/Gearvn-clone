import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { transaction } from '../workflow/workflow.util';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { orderInclude, toOrderView } from './order-view';

@Injectable()
export class OrderStatusService {
    constructor(private readonly db: PrismaService) {}
    change(actorId: string, id: string, dto: UpdateOrderStatusDto) {
        return transaction(this.db, async tx => {
        const row = await tx.order.findUnique({ 
            where: { id }, 
            include: orderInclude 
        });
        if (!row || !row.placedAt) throw new NotFoundException();
        if (row.status === dto.status) return toOrderView(row);
        const expected = dto.status === 'SHIPPING' ? 'PLACED' : 'SHIPPING';
        if (row.status !== expected) throw new ConflictException({
            code: 'ORDER_STATE_CONFLICT', 
            message: 'Không thể chuyển trạng thái này',
        });
        const changed = await tx.order.updateMany({
            where: { id, status: expected },
            data: {
            status: dto.status,
            ...(dto.status === 'SHIPPING' ? { shippedAt: new Date() } : { deliveredAt: new Date() }),
            },
        });
        if (changed.count !== 1) throw new ConflictException('Order đã thay đổi');
        await tx.orderStatusHistory.create({ data: {
            orderId: id, 
            fromStatus: expected, 
            toStatus: dto.status, 
            actorId, 
            reason: dto.note,
        } });
        return toOrderView(await tx.order.findUniqueOrThrow({ 
            where: { id }, 
            include: orderInclude }));
        });
    }
}