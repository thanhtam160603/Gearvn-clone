import { Body, Controller, Headers, HttpCode, Param, Post } from "@nestjs/common";
import { AvailabilityDto, ReserveStockDto } from "./dto/inventory.dto";
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

    @Post("reservations/:id/confirm")
    confirm(@Param("id") id: string) {
        return this.inventoryService.finish(id, "CONFIRMED");
    }

    @Post("reservations/:id/release")
    release(@Param("id") id: string) {
        return this.inventoryService.finish(id, "RELEASED");
    }
}