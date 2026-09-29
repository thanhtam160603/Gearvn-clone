import { createHash } from "node:crypto";
import {
  BadRequestException, ConflictException, Injectable,
  InternalServerErrorException, NotFoundException,
} from "@nestjs/common";
import { Prisma } from "../generated/prisma/client";
import { PrismaService } from "../database/prisma.service";
import type { ReserveStockDto } from "./dto/inventory.dto";

const reservationInclude = {
  items: { orderBy: { productId: "asc" } },
} satisfies Prisma.StockReservationInclude;

type Reservation = Prisma.StockReservationGetPayload<{
  include: typeof reservationInclude;
}>;
type FinalStatus = "CONFIRMED" | "RELEASED" | "EXPIRED";

function toView(row: Reservation) {
  return {
    reservationId: row.id, status: row.status, expiresAt: row.expiresAt,
    lines: row.items.map(({ productId, quantity }) => ({ productId, quantity })),
  };
}
function hasPrismaCode(error: unknown, code: string): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;
}

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async availability(productIds: string[]) {
    const items = await this.prisma.inventory.findMany({
      where: { productId: { in: productIds } },
      select: { productId: true, available: true },
      orderBy: { productId: "asc" },
    });
    const found = new Set(items.map((item) => item.productId));
    return {
      items,
      missingProductIds: productIds.filter((id) => !found.has(id)),
    };
  }

  private async replay(row: Reservation, requestHash: string) {
    if (row.requestHash !== requestHash) {
      throw new ConflictException("Idempotency-Key đã dùng với nội dung khác");
    }
    if (row.status === "PENDING" && row.expiresAt.getTime() <= Date.now()) {
      return this.finish(row.id, "EXPIRED");
    }
    return toView(row);
  }

  async reserve(dto: ReserveStockDto, idempotencyKey: string | undefined) {
    if (!idempotencyKey || !/^[A-Za-z0-9._:-]{1,128}$/.test(idempotencyKey)) {
      throw new BadRequestException("Thiếu hoặc sai Idempotency-Key");
    }
    const lines = [...dto.lines].sort((a, b) =>
      a.productId < b.productId ? -1 : a.productId > b.productId ? 1 : 0,
    );
    if (new Set(lines.map((line) => line.productId)).size !== lines.length) {
      throw new BadRequestException("Không lặp productId trong một reservation");
    }
    const expiresAt = new Date(dto.expiresAt);
    if (!Number.isFinite(expiresAt.getTime())) {
      throw new BadRequestException("expiresAt không hợp lệ");
    }
    const requestHash = createHash("sha256").update(JSON.stringify({
      expiresAt: expiresAt.toISOString(), lines,
    })).digest("hex");

    const existing = await this.prisma.stockReservation.findUnique({
      where: { idempotencyKey }, include: reservationInclude,
    });
    if (existing) return this.replay(existing, requestHash);

    const remaining = expiresAt.getTime() - Date.now();
    if (remaining <= 0 || remaining > 15 * 60_000) {
      throw new BadRequestException("Thời hạn giữ hàng phải trong 15 phút tới");
    }

    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        return await this.prisma.$transaction(async (tx) => {
          // Giành unique key trước; request trùng không được trừ kho trước.
          const reservation = await tx.stockReservation.create({
            data: {
              idempotencyKey, requestHash, expiresAt,
              items: { create: lines },
            },
            include: reservationInclude,
          });
          for (const line of lines) {
            const updated = await tx.inventory.updateMany({
              where: {
                productId: line.productId,
                available: { gte: line.quantity },
              },
              data: {
                available: { decrement: line.quantity },
                reserved: { increment: line.quantity },
              },
            });
            if (updated.count !== 1) {
              throw new ConflictException("Không đủ tồn kho: " + line.productId);
            }
          }
          return toView(reservation);
        });
      } catch (error: unknown) {
        if (hasPrismaCode(error, "P2002")) {
          const winner = await this.prisma.stockReservation.findUnique({
            where: { idempotencyKey }, include: reservationInclude,
          });
          if (winner) return this.replay(winner, requestHash);
        }
        if (hasPrismaCode(error, "P2003")) {
          throw new NotFoundException("Sản phẩm không tồn tại");
        }
        if (hasPrismaCode(error, "P2034") && attempt < 2) continue;
        throw error;
      }
    }
    throw new InternalServerErrorException("Không thể hoàn tất giữ hàng");
  }

  async finish(id: string, requested: FinalStatus) {
    const result = await this.prisma.$transaction(async (tx) => {
      const row = await tx.stockReservation.findUnique({
        where: { id }, include: reservationInclude,
      });
      if (!row) throw new NotFoundException("Không tìm thấy reservation");

      if (row.status !== "PENDING") {
        if (row.status === requested || row.status === "EXPIRED") return toView(row);
        throw new ConflictException("Reservation đã kết thúc: " + row.status);
      }
      const expired = row.expiresAt.getTime() <= Date.now();
      if (requested === "EXPIRED" && !expired) return toView(row);
      const target = expired ? "EXPIRED" : requested;

      const changed = await tx.stockReservation.updateMany({
        where: { id, status: "PENDING" },
        data: { status: target },
      });
      if (changed.count !== 1) {
        // Một process khác đã xử lý trước trong khi request này chờ khóa.
        const latest = await tx.stockReservation.findUniqueOrThrow({
          where: { id }, include: reservationInclude,
        });
        if (latest.status === requested || latest.status === "EXPIRED") {
          return toView(latest);
        }
        throw new ConflictException("Reservation vừa được xử lý bởi request khác");
      }

      const orderedItems = [...row.items].sort((a, b) =>
        a.productId < b.productId ? -1 : a.productId > b.productId ? 1 : 0,
      );
      for (const line of orderedItems) {
        const updated = await tx.inventory.updateMany({
          where: { productId: line.productId, reserved: { gte: line.quantity } },
          data: target === "CONFIRMED"
            ? { reserved: { decrement: line.quantity } }
            : {
                reserved: { decrement: line.quantity },
                available: { increment: line.quantity },
              },
        });
        if (updated.count !== 1) {
          throw new InternalServerErrorException("Inventory invariant bị vi phạm");
        }
      }
      return toView({ ...row, status: target });
    });

    // Throw SAU commit để stock của reservation hết hạn vẫn được hoàn lại.
    if (requested === "CONFIRMED" && result.status === "EXPIRED") {
      throw new ConflictException("Reservation đã hết hạn, không thể confirm");
    }
    return result;
  }

  async expireDue() {
    const rows = await this.prisma.stockReservation.findMany({
      where: { status: "PENDING", expiresAt: { lte: new Date() } },
      select: { id: true }, orderBy: { expiresAt: "asc" }, take: 100,
    });
    for (const row of rows) {
      try {
        await this.finish(row.id, "EXPIRED");
      } catch (error: unknown) {
        // Confirm/release có thể thắng race; không hoàn hàng lần thứ hai.
        if (!(error instanceof ConflictException)) throw error;
      }
    }
  }
}