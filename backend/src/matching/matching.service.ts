import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { LikeAction, PhotoModerationStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { BlocksService } from "../safety/blocks.service";
import { computeAge } from "../common/utils/age.util";
import type { CreateLikeDto } from "./dto/create-like.dto";
import type { PaginationQueryDto } from "../common/dto/pagination-query.dto";

const RECIPROCAL_ACTIONS: LikeAction[] = [LikeAction.LIKE, LikeAction.SUPER_LIKE];

export interface CandidateSummary {
  userId: string;
  displayName: string;
  age: number | null;
  bio: string | null;
  intent: string | null;
  city: string | null;
  verifiedBadge: boolean;
  photos: { id: string; storageKey: string; isPrimary: boolean }[];
  promptAnswers: { promptKey: string; answer: string }[];
}

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
    const match = await this.createMatchIdempotently(userAId, userBId);

    await this.auditService.record({
      actorId,
      action: "match.create",
      subjectId: dto.targetId,
      metadata: { matchId: match.id },
    });

    return { like, match };
  }

  /**
   * The find-then-create sequence below still has a race window between the
   * `findUnique` and the `create`: two requests recording the reciprocal halves of the
   * same mutual like at the same instant (e.g. two retries, or two devices for the same
   * account) can both observe "no match yet" and both attempt to create one. The unique
   * constraint on [userAId, userBId] is what actually prevents a duplicate row — this
   * catch turns that constraint violation into the same idempotent result the slower
   * request would have gotten anyway, instead of an opaque 500.
   */
  private async createMatchIdempotently(userAId: string, userBId: string) {
    try {
      return await this.prisma.$transaction(async (tx) => {
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
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        return this.prisma.match.findUniqueOrThrow({ where: { userAId_userBId: { userAId, userBId } } });
      }
      throw error;
    }
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

    const summaries = await this.hydrateCandidateSummaries(visible.map((l) => l.actorId));
    const summaryById = new Map(summaries.map((s) => [s.userId, s]));

    return visible
      .map((like) => {
        const profile = summaryById.get(like.actorId);
        return profile ? { ...profile, likedAt: like.createdAt, action: like.action } : null;
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null);
  }

  /**
   * A batch of other users to decide on ("today's matches" in the product UI). No
   * compatibility score is computed or returned — there is no real scoring algorithm yet
   * (see docs/ember/ROADMAP.md Phase 3), and fabricating one to look plausible would be
   * exactly the kind of placeholder functionality the build policy rules out.
   */
  async listCandidates(userId: string, query: PaginationQueryDto): Promise<CandidateSummary[]> {
    const preferences = await this.prisma.preferences.findUnique({ where: { userId } });
    const ageMin = preferences?.ageMin ?? 18;
    const ageMax = preferences?.ageMax ?? 99;
    const verifiedOnly = preferences?.verifiedOnly ?? false;

    const decided = await this.prisma.like.findMany({ where: { actorId: userId }, select: { targetId: true } });
    const blocks = await this.prisma.block.findMany({
      where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
      select: { blockerId: true, blockedId: true },
    });

    const excludedIds = new Set<string>([
      userId,
      ...decided.map((d) => d.targetId),
      ...blocks.map((b) => (b.blockerId === userId ? b.blockedId : b.blockerId)),
    ]);

    // Age range isn't a direct SQL predicate here because age is derived from
    // dateOfBirth, not stored — we over-fetch a pool and filter/paginate in application
    // code. Fine at development scale; revisit (a generated/materialized age column, or
    // a stored-procedure predicate) if this ever needs to scale — see ARCHITECTURE.md §2
    // on not over-engineering for scale that doesn't exist yet, applied in the other
    // direction: this is the honest, simple version, not a premature optimization.
    const pool = await this.prisma.users.findMany({
      where: {
        id: { notIn: Array.from(excludedIds) },
        deletedAt: null,
        status: "ACTIVE",
        profile: { is: { visible: true, deletedAt: null, ...(verifiedOnly ? { verifiedBadge: true } : {}) } },
      },
      select: {
        id: true,
        dateOfBirth: true,
        profile: {
          select: {
            displayName: true,
            bio: true,
            intent: true,
            city: true,
            verifiedBadge: true,
            photos: { where: { moderationStatus: PhotoModerationStatus.APPROVED } },
            promptAnswers: true,
          },
        },
      },
      take: 200, // candidate pool ceiling before in-app age filtering
    });

    const filtered = pool
      .filter((u) => u.profile !== null && u.dateOfBirth !== null)
      .map((u) => ({ ...u, age: computeAge(u.dateOfBirth as Date) }))
      .filter((u) => u.age >= ageMin && u.age <= ageMax);

    return filtered.slice(query.skip, query.skip + query.take).map((u) => ({
      userId: u.id,
      displayName: u.profile!.displayName,
      age: u.age,
      bio: u.profile!.bio,
      intent: u.profile!.intent,
      city: u.profile!.city,
      verifiedBadge: u.profile!.verifiedBadge,
      photos: u.profile!.photos.map((p) => ({ id: p.id, storageKey: p.storageKey, isPrimary: p.isPrimary })),
      promptAnswers: u.profile!.promptAnswers.map((p) => ({ promptKey: p.promptKey, answer: p.answer })),
    }));
  }

  private async hydrateCandidateSummaries(userIds: string[]): Promise<CandidateSummary[]> {
    if (userIds.length === 0) return [];

    const users = await this.prisma.users.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        dateOfBirth: true,
        profile: {
          select: {
            displayName: true,
            bio: true,
            intent: true,
            city: true,
            verifiedBadge: true,
            photos: { where: { moderationStatus: PhotoModerationStatus.APPROVED } },
            promptAnswers: true,
          },
        },
      },
    });

    return users
      .filter((u) => u.profile !== null)
      .map((u) => ({
        userId: u.id,
        displayName: u.profile!.displayName,
        age: u.dateOfBirth ? computeAge(u.dateOfBirth) : null,
        bio: u.profile!.bio,
        intent: u.profile!.intent,
        city: u.profile!.city,
        verifiedBadge: u.profile!.verifiedBadge,
        photos: u.profile!.photos.map((p) => ({ id: p.id, storageKey: p.storageKey, isPrimary: p.isPrimary })),
        promptAnswers: u.profile!.promptAnswers.map((p) => ({ promptKey: p.promptKey, answer: p.answer })),
      }));
  }
}

/** Canonical ordering so a match between A and B always stores as one row, not two. */
function orderPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}
