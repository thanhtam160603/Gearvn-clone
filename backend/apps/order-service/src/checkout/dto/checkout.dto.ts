import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, Length, Matches, MaxLength } from 'class-validator';
export const Trim = () => Transform(({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value);

export class CheckoutDto {
  @Trim() @IsString() @Length(1, 100) recipientName!: string;
  @Trim() @IsString() @Length(8, 20) @Matches(/^[+0-9 ()-]+$/) phone!: string;
  @Trim() @IsString() @Length(1, 300) addressLine!: string;
  @Trim() @IsString() @Length(1, 100) ward!: string;
  @Trim() @IsString() @Length(1, 100) district!: string;
  @Trim() @IsString() @Length(1, 100) city!: string;
  @Trim() @IsOptional() @IsString() @MaxLength(500) note?: string;
  @IsIn(['COD']) paymentMethod!: 'COD';
}