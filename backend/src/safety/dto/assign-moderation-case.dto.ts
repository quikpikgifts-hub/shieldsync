import { ApiProperty } from "@nestjs/swagger";
import { IsUUID } from "class-validator";

export class AssignModerationCaseDto {
  @ApiProperty()
  @IsUUID()
  assigneeId!: string;
}
