import { IsInt, IsNotEmpty, IsString, Max, MaxLength, Min } from "class-validator";

export class AddItemDto {
  @IsString() @IsNotEmpty() @MaxLength(128)
  productId!: string;

  @IsInt() @Min(1) @Max(99)
  quantity!: number;
}
