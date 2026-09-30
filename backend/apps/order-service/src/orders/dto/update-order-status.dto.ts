import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { Trim } from '../../checkout/dto/checkout.dto';
export class UpdateOrderStatusDto {
  @IsIn(['SHIPPING', 'DELIVERED']) status!: 'SHIPPING' | 'DELIVERED';
  @Trim() @IsOptional() @IsString() @MaxLength(500) note?: string;
}