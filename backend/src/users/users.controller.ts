import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { RequirePermissions } from "../common/decorators/require-permissions.decorator";
import type { AuthenticatedUser } from "../auth/strategies/jwt.strategy";
import { UsersService } from "./users.service";
import { ListUsersQueryDto } from "./dto/list-users-query.dto";

@ApiTags("users")
@ApiBearerAuth()
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("me")
  @ApiOperation({ summary: "Get the authenticated user's own account record." })
  async me(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.findById(user.id);
  }

  @Get()
  @RequirePermissions("users.read")
  @ApiOperation({ summary: "List user accounts (moderator/support/admin only)." })
  async list(@Query() query: ListUsersQueryDto) {
    return this.usersService.list(query);
  }

  @Get(":id")
  @RequirePermissions("users.read")
  @ApiOperation({ summary: "Get another user's account record (moderator/support/admin only)." })
  async findOne(@Param("id") id: string) {
    return this.usersService.findById(id);
  }
}
