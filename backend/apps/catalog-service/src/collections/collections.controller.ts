import { Controller, Get, Param, Query } from "@nestjs/common";
import { CollectionsService } from "./collections.service";

@Controller("collections")
export class CollectionsController {
  constructor(private readonly collections: CollectionsService) {}

  @Get(":slug")
  detail(@Param("slug") slug: string, @Query() query: Record<string, unknown>) {
    return this.collections.detail(slug, query);
  }
}