import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ReportReason } from "@prisma/client";
import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";

export class CreateReportDto {
  @ApiProperty()
  @IsUUID()
  subjectId!: string;

  @ApiProperty({ enum: ReportReason })
  @IsEnum(ReportReason)
  reason!: ReportReason;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  details?: string;
}
