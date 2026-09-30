import { Type } from "class-transformer";
import {
  ArrayMaxSize, ArrayMinSize, ArrayUnique, IsArray, IsInt,
  IsNotEmpty, IsString, Max, MaxLength, Min, ValidateNested,
} from 'class-validator';

export class CleanupLineDto {
    @IsString() @IsNotEmpty() @MaxLength(128)
    cartItemId!: string;

    @IsString() @IsNotEmpty() @MaxLength(128)
    productId!: string;

    @IsInt() @Min(1) @Max(99)
    quantity!: number;

    @IsInt() @Min(0)
    itemVersion!: number;
}

export class CartCheckoutCleanupDto {
    @IsString() @IsNotEmpty() @MaxLength(128)
    orderId!: string;

    @IsString() @IsNotEmpty() @MaxLength(128)
    userId!: string;

    @IsString() @IsNotEmpty() @MaxLength(128)
    cartId!: string;

    @IsArray() @ArrayMinSize(1) @ArrayMaxSize(100)
    @ArrayUnique((line: CleanupLineDto) => line.cartItemId)
    @ArrayUnique((line: CleanupLineDto) => line.productId)
    @ValidateNested({ each: true }) @Type(() => CleanupLineDto)
    lines!: CleanupLineDto[];
}