import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { PaginationQueryDto } from "../common/dto/pagination-query.dto";
import type { AuthenticatedUser } from "../auth/strategies/jwt.strategy";
import { MatchingService } from "./matching.service";
import { CreateLikeDto } from "./dto/create-like.dto";

@ApiTags("matching")
@ApiBearerAuth()
@Controller("matching")
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  @Get("candidates")
  @ApiOperation({ summary: "A batch of other users to decide on, respecting preferences and blocks." })
  async listCandidates(@CurrentUser() user: AuthenticatedUser, @Query() query: PaginationQueryDto) {
    return this.matchingService.listCandidates(user.id, query);
  }

  @Post("likes")
  @ApiOperation({ summary: "Like, pass, or super-like another user. Creates a match on reciprocity." })
  async recordDecision(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateLikeDto) {
    return this.matchingService.recordDecision(user.id, dto);
  }

  @Get("matches")
  @ApiOperation({ summary: "List the authenticated user's active matches." })
  async listMatches(@CurrentUser() user: AuthenticatedUser) {
    return this.matchingService.listMatches(user.id);
  }

  @Get("likes/received")
  @ApiOperation({ summary: "List users who have liked the authenticated user." })
  async listLikesReceived(@CurrentUser() user: AuthenticatedUser) {
    return this.matchingService.listLikesReceived(user.id);
  }
}
