import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, type WarrantyStatus } from '../generated/prisma/client';
import { PrismaService } from '../database/prisma.service';
import { prismaCode, transaction } from '../workflow/workflow.util';
import { CreateWarrantyDto } from './dto/create-warranty.dto';
import { ListWarrantiesDto } from './dto/list-warranties.dto';
import { UpdateWarrantyStatusDto } from './dto/update-warranty-status.dto';
import { warrantyInclude, toWarrantyView } from './warranty-view';

@Injectable()
export class WarrantyService {
    constructor(private readonly db: PrismaService) {}

    async create(userId: string, dto: CreateWarrantyDto) {
        try {
        return await transaction(this.db, async tx => {
            const item = await tx.orderItem.findFirst({
            where: { id: dto.orderItemId, order: { userId } }, include: { order: true },
            });
            if (!item) throw new NotFoundException();
            if (item.order.status !== 'DELIVERED') throw new ConflictException({
            code: 'ORDER_NOT_DELIVERED', message: 'Đơn chưa giao thành công',
            });
            const row = await tx.warrantyRequest.create({
            data: {
                userId, orderItemId: item.id, reason: dto.reason, description: dto.description,
                history: { create: { toStatus: 'OPEN', actorId: userId } },
            },
            include: warrantyInclude,
            });
            return toWarrantyView(row);
        });
        } catch (error) {
        if (prismaCode(error, 'P2002')) {
            const active = await this.db.warrantyRequest.findFirst({
            where: { orderItemId: dto.orderItemId, userId, status: { not: 'CLOSED' } },
            });
            if (active) throw new ConflictException({
            code: 'WARRANTY_ALREADY_OPEN', message: 'Item đã có yêu cầu bảo hành chưa đóng',
            });
        }
        throw error;
        }
    }

    list(userId: string, query: ListWarrantiesDto) {
        const where: Prisma.WarrantyRequestWhereInput = {
        userId, ...(query.status ? { status: query.status } : {}),
        };
        return transaction(this.db, async tx => {
        const totalItems = await tx.warrantyRequest.count({ where });
        const rows = await tx.warrantyRequest.findMany({
            where, include: warrantyInclude,
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
            skip: (query.page - 1) * query.pageSize, take: query.pageSize,
        });
        return {
            items: rows.map(toWarrantyView), page: query.page, pageSize: query.pageSize,
            totalItems, totalPages: Math.ceil(totalItems / query.pageSize),
        };
        });
    }

    async detail(userId: string, id: string) {
        const row = await this.db.warrantyRequest.findFirst({
        where: { id, userId }, include: warrantyInclude,
        });
        if (!row) throw new NotFoundException();
        return toWarrantyView(row);
    }

    change(actorId: string, id: string, dto: UpdateWarrantyStatusDto) {
        const allowed: Record<WarrantyStatus, WarrantyStatus[]> = {
        OPEN: ['IN_REVIEW'],
        IN_REVIEW: ['APPROVED', 'REJECTED'],
        APPROVED: ['CLOSED'], REJECTED: ['CLOSED'], CLOSED: [],
        };
        return transaction(this.db, async tx => {
        const row = await tx.warrantyRequest.findUnique({ where: { id }, include: warrantyInclude });
        if (!row) throw new NotFoundException();
        if (row.status === dto.status) return toWarrantyView(row);
        if (!allowed[row.status].includes(dto.status)) throw new ConflictException({
            code: 'WARRANTY_STATE_CONFLICT', message: 'Không thể chuyển trạng thái bảo hành này',
        });
        const changed = await tx.warrantyRequest.updateMany({
            where: { id, status: row.status }, data: { status: dto.status },
        });
        if (changed.count !== 1) throw new ConflictException('Yêu cầu đã thay đổi');
        await tx.warrantyStatusHistory.create({ data: {
            warrantyId: id, fromStatus: row.status, toStatus: dto.status, actorId, note: dto.note,
        } });
        return toWarrantyView(await tx.warrantyRequest.findUniqueOrThrow({
            where: { id }, include: warrantyInclude,
        }));
        });
    }
}