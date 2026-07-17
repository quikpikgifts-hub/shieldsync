import { Injectable, NotFoundException } from "@nestjs/common";
import { ModerationAction, ModerationCaseStatus, ReportStatus, UserStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { paginate, type PaginatedResult, type PaginationQueryDto } from "../common/dto/pagination-query.dto";

@Injectable()
export class ModerationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async list(query: PaginationQueryDto): Promise<PaginatedResult<unknown>> {
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.moderationCase.findMany({
        include: { reports: true },
        orderBy: { createdAt: query.sortDir },
        skip: query.skip,
        take: query.take,
      }),
      this.prisma.moderationCase.count(),
    ]);
    return paginate(rows, total, query);
  }

  async assign(caseId: string, assigneeId: string, actorId: string) {
    const moderationCase = await this.prisma.moderationCase.findUnique({ where: { id: caseId } });
    if (!moderationCase) {
      throw new NotFoundException("Moderation case not found");
    }

    const updated = await this.prisma.moderationCase.update({
      where: { id: caseId },
      data: { assigneeId, status: ModerationCaseStatus.IN_REVIEW },
    });

    await this.auditService.record({
      actorId,
      action: "moderation.case_assign",
      subjectId: moderationCase.subjectId,
      metadata: { caseId, assigneeId },
    });

    return updated;
  }

  async resolve(caseId: string, action: ModerationAction, notes: string | undefined, actorId: string) {
    const moderationCase = await this.prisma.moderationCase.findUnique({
      where: { id: caseId },
      include: { reports: true },
    });
    if (!moderationCase) {
      throw new NotFoundException("Moderation case not found");
    }

    const statusMap: Partial<Record<ModerationAction, UserStatus>> = {
      [ModerationAction.SUSPENDED]: UserStatus.SUSPENDED,
      [ModerationAction.BANNED]: UserStatus.BANNED,
    };
    const newUserStatus = statusMap[action];

    // See the comment in ReportsService.create: audit writes happen after the
    // transaction commits, not inside the callback.
    const updatedCase = await this.prisma.$transaction(async (tx) => {
      const result = await tx.moderationCase.update({
        where: { id: caseId },
        data: {
          action,
          notes,
          status: ModerationCaseStatus.ACTION_TAKEN,
          resolvedAt: new Date(),
        },
      });

      await tx.report.updateMany({
        where: { moderationCaseId: caseId, status: { in: [ReportStatus.OPEN, ReportStatus.IN_REVIEW] } },
        data: { status: ReportStatus.RESOLVED, resolvedAt: new Date() },
      });

      if (newUserStatus) {
        await tx.users.update({
          where: { id: moderationCase.subjectId },
          data: { status: newUserStatus },
        });
        // Revoke every active session immediately — a suspended/banned account should
        // not be able to keep using an access token issued before the decision.
        await tx.session.updateMany({
          where: { userId: moderationCase.subjectId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
        await tx.refreshToken.updateMany({
          where: { userId: moderationCase.subjectId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      }

      return result;
    });

    await this.auditService.record({
      actorId,
      action: "moderation.action_taken",
      subjectId: moderationCase.subjectId,
      metadata: { caseId, action, resultingUserStatus: newUserStatus ?? null },
    });

    return updatedCase;
  }
}
