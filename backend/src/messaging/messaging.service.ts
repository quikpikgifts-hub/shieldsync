import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { MessageKind } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { BlocksService } from "../safety/blocks.service";
import { paginate, type PaginatedResult, type PaginationQueryDto } from "../common/dto/pagination-query.dto";
import type { SendMessageDto } from "./dto/send-message.dto";

@Injectable()
export class MessagingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly blocksService: BlocksService,
  ) {}

  async listMessages(userId: string, matchId: string, query: PaginationQueryDto): Promise<PaginatedResult<unknown>> {
    const conversation = await this.getConversationForMember(userId, matchId);

    const where = { conversationId: conversation.id, deletedAt: null };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.message.findMany({
        where,
        orderBy: { sentAt: query.sortDir },
        skip: query.skip,
        take: query.take,
      }),
      this.prisma.message.count({ where }),
    ]);

    return paginate(rows, total, query);
  }

  async sendMessage(userId: string, matchId: string, dto: SendMessageDto) {
    const conversation = await this.getConversationForMember(userId, matchId);
    const otherUserId = conversation.match.userAId === userId ? conversation.match.userBId : conversation.match.userAId;

    if (await this.blocksService.isBlocked(userId, otherUserId)) {
      throw new ForbiddenException("You cannot message this user.");
    }

    return this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: userId,
        kind: dto.kind ?? MessageKind.TEXT,
        body: dto.body,
        mediaStorageKey: dto.mediaStorageKey,
      },
    });
  }

  private async getConversationForMember(userId: string, matchId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { matchId },
      include: { match: true },
    });

    if (!conversation || conversation.match.unmatchedAt) {
      throw new NotFoundException("Conversation not found");
    }

    const isMember = conversation.match.userAId === userId || conversation.match.userBId === userId;
    if (!isMember) {
      throw new ForbiddenException("You are not part of this conversation.");
    }

    return conversation;
  }
}
