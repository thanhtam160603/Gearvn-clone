import { Body, Controller, Get, Headers, Param, Post, UseGuards } from "@nestjs/common";
import { InternalServiceGuard } from "@app/common";
import { AvailabilityDto, ReserveStockDto, ReturnStockDto } from "./dto/inventory.dto";
import { InventoryService } from "./inventory.service";

@Controller("internal/inventory")
export class InventoryInternalController {
    constructor(private readonly inventoryService: InventoryService) {}

    @Post("availability")
    availability(@Body() dto: AvailabilityDto) {
        return this.inventoryService.availability(dto.productIds);
    }

    @Post("reservations")
    reservation(@Body() dto: ReserveStockDto, @Headers("idempotency-key") idempotencyKey: string | undefined) {
        return this.inventoryService.reserve(dto, idempotencyKey);
    }

    @Get("reservations/by-key/:key")
    @UseGuards(InternalServiceGuard)
    reservationByKey(@Param("key") key: string) {
        return this.inventoryService.findReservationByKey(key);
    }

    @Post("returns")
    @UseGuards(InternalServiceGuard)
    returnStock(@Body() dto: ReturnStockDto, @Headers("idempotency-key") key: string | undefined) {
        return this.inventoryService.returnStock(dto, key);
    }

    @Post("reservations/:id/confirm")
    confirm(@Param("id") id: string) {
        return this.inventoryService.finish(id, "CONFIRMED");
    }

    @Post("reservations/:id/release")
    release(@Param("id") id: string) {
        return this.inventoryService.finish(id, "RELEASED");
    }
}
