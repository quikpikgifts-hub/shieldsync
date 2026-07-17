import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { LikeAction } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { BlocksService } from "../safety/blocks.service";
import type { CreateLikeDto } from "./dto/create-like.dto";

const RECIPROCAL_ACTIONS: LikeAction[] = [LikeAction.LIKE, LikeAction.SUPER_LIKE];

@Injectable()
export class MatchingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly blocksService: BlocksService,
  ) {}

  async recordDecision(actorId: string, dto: CreateLikeDto) {
    if (actorId === dto.targetId) {
      throw new BadRequestException("You cannot like or pass on yourself.");
    }

    const target = await this.prisma.users.findUnique({ where: { id: dto.targetId } });
    if (!target || target.deletedAt) {
      throw new NotFoundException("User not found");
    }

    if (await this.blocksService.isBlocked(actorId, dto.targetId)) {
      throw new ForbiddenException("You cannot interact with this user.");
    }

    const like = await this.prisma.like.upsert({
      where: { actorId_targetId: { actorId, targetId: dto.targetId } },
      update: { action: dto.action },
      create: { actorId, targetId: dto.targetId, action: dto.action },
    });

    await this.auditService.record({
      actorId,
      action: "like.create",
      subjectId: dto.targetId,
      metadata: { likeAction: dto.action },
    });

    if (!RECIPROCAL_ACTIONS.includes(dto.action)) {
      return { like, match: null };
    }

    const reciprocal = await this.prisma.like.findUnique({
      where: { actorId_targetId: { actorId: dto.targetId, targetId: actorId } },
    });

    if (!reciprocal || !RECIPROCAL_ACTIONS.includes(reciprocal.action)) {
      return { like, match: null };
    }

    const [userAId, userBId] = orderPair(actorId, dto.targetId);

    const match = await this.prisma.$transaction(async (tx) => {
      const existingMatch = await tx.match.findUnique({
        where: { userAId_userBId: { userAId, userBId } },
      });
      if (existingMatch) {
        return existingMatch;
      }

      const created = await tx.match.create({ data: { userAId, userBId } });
      await tx.conversation.create({ data: { matchId: created.id } });
      return created;
    });

    await this.auditService.record({
      actorId,
      action: "match.create",
      subjectId: dto.targetId,
      metadata: { matchId: match.id },
    });

    return { like, match };
  }

  async listMatches(userId: string) {
    return this.prisma.match.findMany({
      where: {
        OR: [{ userAId: userId }, { userBId: userId }],
        unmatchedAt: null,
      },
      include: { conversation: true },
      orderBy: { matchedAt: "desc" },
    });
  }

  async listLikesReceived(userId: string) {
    const likes = await this.prisma.like.findMany({
      where: { targetId: userId, action: { in: RECIPROCAL_ACTIONS } },
      orderBy: { createdAt: "desc" },
      select: { actorId: true, action: true, createdAt: true },
    });

    // Filter out anyone the recipient has blocked (or been blocked by) — a blocked user's
    // like should not surface here even though the underlying row still exists.
    const visible = [];
    for (const like of likes) {
      if (!(await this.blocksService.isBlocked(userId, like.actorId))) {
        visible.push(like);
      }
    }
    return visible;
  }
}

/** Canonical ordering so a match between A and B always stores as one row, not two. */
function orderPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}
