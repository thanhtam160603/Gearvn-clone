import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
export class ListWarrantiesDto {
  @Type(() => Number) @IsInt() @Min(1) page = 1;
  @Type(() => Number) @IsInt() @Min(1) @Max(50) pageSize = 10;
  @IsOptional() @IsIn(['OPEN', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'CLOSED'])
  status?: 'OPEN' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'CLOSED';
}