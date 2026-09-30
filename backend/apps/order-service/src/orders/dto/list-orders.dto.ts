import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
export class ListOrdersDto {
  @Type(() => Number) @IsInt() @Min(1) page = 1;
  @Type(() => Number) @IsInt() @Min(1) @Max(50) pageSize = 10;
  @IsOptional()
  @IsIn(['PLACED', 'CANCELLATION_PENDING', 'SHIPPING', 'DELIVERED', 'CANCELLED'])
  status?: 'PLACED' | 'CANCELLATION_PENDING' | 'SHIPPING' | 'DELIVERED' | 'CANCELLED';
}