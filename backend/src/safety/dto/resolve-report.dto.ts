import { ApiProperty } from "@nestjs/swagger";
import { ReportStatus } from "@prisma/client";
import { IsIn } from "class-validator";

export class ResolveReportDto {
  @ApiProperty({ enum: [ReportStatus.RESOLVED, ReportStatus.DISMISSED] })
  @IsIn([ReportStatus.RESOLVED, ReportStatus.DISMISSED])
  status!: typeof ReportStatus.RESOLVED | typeof ReportStatus.DISMISSED;
}
