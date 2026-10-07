import { Type } from "class-transformer";
import {
  ArrayMaxSize, ArrayMinSize, ArrayUnique, IsArray, IsInt, IsISO8601,
  IsNotEmpty, IsString, Max, MaxLength, Min, ValidateNested,
} from "class-validator";

export class ReservationLineDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  productId!: string;

  @IsInt()
  @Min(1)
  @Max(1_000_000)
  quantity!: number;
}

export class ReserveStockDto {
  @IsString()
  @IsISO8601({ strict: true })
  expiresAt!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => ReservationLineDto)
  lines!: ReservationLineDto[];
}

export class AvailabilityDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ArrayUnique()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @MaxLength(128, { each: true })
  productIds!: string[];
}

export class ReturnStockDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  orderId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  reservationId!: string;
}
