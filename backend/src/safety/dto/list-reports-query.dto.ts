import { ApiPropertyOptional } from "@nestjs/swagger";
import { ReportStatus } from "@prisma/client";
import { IsIn, IsOptional } from "class-validator";
import { PaginationQueryDto } from "../../common/dto/pagination-query.dto";

export class ListReportsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ReportStatus })
  @IsOptional()
  @IsIn(Object.values(ReportStatus))
  status?: ReportStatus;
}
