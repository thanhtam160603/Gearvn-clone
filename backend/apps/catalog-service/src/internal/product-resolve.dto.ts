import { ArrayMaxSize, ArrayMinSize, ArrayUnique, IsArray, IsNotEmpty, IsString, MaxLength } from "class-validator";

export class ProductIdsDto {
    @IsArray()
    @ArrayMinSize(1)
    @ArrayMaxSize(100)
    @ArrayUnique()
    @IsString({ each: true })
    @IsNotEmpty({ each: true })
    @MaxLength(128, { each: true })
    productIds!: string[];
}