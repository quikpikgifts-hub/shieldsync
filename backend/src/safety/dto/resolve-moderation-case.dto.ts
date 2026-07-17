import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ModerationAction } from "@prisma/client";
import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator";

export class ResolveModerationCaseDto {
  @ApiProperty({ enum: ModerationAction })
  @IsEnum(ModerationAction)
  action!: ModerationAction;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  notes?: string;
}
