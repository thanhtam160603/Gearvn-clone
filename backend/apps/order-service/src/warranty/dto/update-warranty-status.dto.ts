import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { Trim } from '../../checkout/dto/checkout.dto';
export class UpdateWarrantyStatusDto {
  @IsIn(['IN_REVIEW', 'APPROVED', 'REJECTED', 'CLOSED'])
  status!: 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'CLOSED';
  @Trim() @IsOptional() @IsString() @MaxLength(2000) note?: string;
}