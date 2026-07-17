import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../auth/strategies/jwt.strategy";
import { BlocksService } from "./blocks.service";
import { CreateBlockDto } from "./dto/create-block.dto";

@ApiTags("safety/blocks")
@ApiBearerAuth()
@Controller("blocks")
export class BlocksController {
  constructor(private readonly blocksService: BlocksService) {}

  @Post()
  @ApiOperation({ summary: "Block another user." })
  async create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateBlockDto) {
    return this.blocksService.create(user.id, dto.blockedId);
  }

  @Get()
  @ApiOperation({ summary: "List users the authenticated user has blocked." })
  async listOwn(@CurrentUser() user: AuthenticatedUser) {
    return this.blocksService.listOwn(user.id);
  }

  @Delete(":blockedId")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Unblock a user." })
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param("blockedId", new ParseUUIDPipe()) blockedId: string,
  ): Promise<void> {
    await this.blocksService.remove(user.id, blockedId);
  }
}
