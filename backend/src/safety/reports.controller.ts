import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { RequirePermissions } from "../common/decorators/require-permissions.decorator";
import { PaginationQueryDto } from "../common/dto/pagination-query.dto";
import type { AuthenticatedUser } from "../auth/strategies/jwt.strategy";
import { ReportsService } from "./reports.service";
import { CreateReportDto } from "./dto/create-report.dto";
import { ListReportsQueryDto } from "./dto/list-reports-query.dto";
import { ResolveReportDto } from "./dto/resolve-report.dto";

@ApiTags("safety/reports")
@ApiBearerAuth()
@Controller("reports")
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  @ApiOperation({ summary: "File a report against another user." })
  async create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateReportDto) {
    return this.reportsService.create(user.id, dto);
  }

  @Get("me")
  @ApiOperation({ summary: "List reports filed by the authenticated user." })
  async listOwn(@CurrentUser() user: AuthenticatedUser, @Query() query: PaginationQueryDto) {
    return this.reportsService.listOwn(user.id, query);
  }

  @Get()
  @RequirePermissions("reports.read")
  @ApiOperation({ summary: "List all reports (moderator/support/admin only)." })
  async listAll(@Query() query: ListReportsQueryDto) {
    return this.reportsService.listAll(query);
  }

  @Patch(":reportId/resolve")
  @RequirePermissions("reports.resolve")
  @ApiOperation({ summary: "Resolve or dismiss a report (moderator/admin only)." })
  async resolve(
    @Param("reportId", new ParseUUIDPipe()) reportId: string,
    @Body() dto: ResolveReportDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.reportsService.resolve(reportId, dto.status, user.id);
  }
}
