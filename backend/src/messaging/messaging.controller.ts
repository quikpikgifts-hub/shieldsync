import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { PaginationQueryDto } from "../common/dto/pagination-query.dto";
import type { AuthenticatedUser } from "../auth/strategies/jwt.strategy";
import { MessagingService } from "./messaging.service";
import { SendMessageDto } from "./dto/send-message.dto";

@ApiTags("messaging")
@ApiBearerAuth()
@Controller("conversations")
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  @Get(":matchId/messages")
  @ApiOperation({ summary: "List messages in the conversation for a given match." })
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @Param("matchId", new ParseUUIDPipe()) matchId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.messagingService.listMessages(user.id, matchId, query);
  }

  @Post(":matchId/messages")
  @ApiOperation({ summary: "Send a message in the conversation for a given match." })
  async send(
    @CurrentUser() user: AuthenticatedUser,
    @Param("matchId", new ParseUUIDPipe()) matchId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.messagingService.sendMessage(user.id, matchId, dto);
  }
}
