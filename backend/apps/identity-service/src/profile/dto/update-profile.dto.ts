import {
  IsDateString,
  IsOptional,
  IsString,
  MinLength,
} from "class-validator";

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsDateString()
  birthDate?: string;
}