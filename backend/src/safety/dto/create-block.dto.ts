import { ApiProperty } from "@nestjs/swagger";
import { IsUUID } from "class-validator";

export class CreateBlockDto {
  @ApiProperty()
  @IsUUID()
  blockedId!: string;
}
