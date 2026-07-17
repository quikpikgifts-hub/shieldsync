import { Body, Controller, Get, Param, Patch, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { RequirePermissions } from "../common/decorators/require-permissions.decorator";
import { PaginationQueryDto } from "../common/dto/pagination-query.dto";
import type { AuthenticatedUser } from "../auth/strategies/jwt.strategy";
import { ModerationService } from "./moderation.service";
import { AssignModerationCaseDto } from "./dto/assign-moderation-case.dto";
import { ResolveModerationCaseDto } from "./dto/resolve-moderation-case.dto";

@ApiTags("safety/moderation")
@ApiBearerAuth()
@Controller("moderation-cases")
export class ModerationController {
  constructor(private readonly moderationService: ModerationService) {}

  @Get()
  @RequirePermissions("reports.read")
  @ApiOperation({ summary: "List moderation cases (moderator/support/admin only)." })
  async list(@Query() query: PaginationQueryDto) {
    return this.moderationService.list(query);
  }

  @Patch(":caseId/assign")
  @RequirePermissions("moderation.assign")
  @ApiOperation({ summary: "Assign a moderation case to a moderator." })
  async assign(
    @Param("caseId") caseId: string,
    @Body() dto: AssignModerationCaseDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.moderationService.assign(caseId, dto.assigneeId, user.id);
  }

  @Patch(":caseId/resolve")
  @RequirePermissions("moderation.resolve")
  @ApiOperation({ summary: "Resolve a moderation case with a final action." })
  async resolve(
    @Param("caseId") caseId: string,
    @Body() dto: ResolveModerationCaseDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.moderationService.resolve(caseId, dto.action, dto.notes, user.id);
  }
}
