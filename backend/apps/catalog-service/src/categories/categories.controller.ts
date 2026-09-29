import { Controller, Get } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";

@Controller("categories")
export class CategoriesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list() {
    return this.prisma.category.findMany({
      select: { id: true, slug: true, title: true },
      orderBy: { title: "asc" },
    });
  }
}