import { IsBoolean } from "class-validator";

export class SelectionDto {
  @IsBoolean()
  selected!: boolean;
}