import { IsOptional, IsString, Length, MaxLength } from 'class-validator';
import { Trim } from '../../checkout/dto/checkout.dto';
export class CreateWarrantyDto {
  @IsString() @Length(1, 128) orderItemId!: string;
  @Trim() @IsString() @Length(1, 200) reason!: string;
  @Trim() @IsOptional() @IsString() @MaxLength(2000) description?: string;
}