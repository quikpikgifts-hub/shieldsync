import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ModerationCaseStatus, ReportStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { paginate, type PaginatedResult, type PaginationQueryDto } from "../common/dto/pagination-query.dto";
import type { CreateReportDto } from "./dto/create-report.dto";
import type { ListReportsQueryDto } from "./dto/list-reports-query.dto";

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(reporterId: string, dto: CreateReportDto) {
    if (reporterId === dto.subjectId) {
      throw new BadRequestException("You cannot report yourself.");
    }

    const subject = await this.prisma.users.findUnique({ where: { id: dto.subjectId } });
    if (!subject) {
      throw new NotFoundException("The reported user does not exist.");
    }

    // Audit writes happen after the transaction commits, not inside the callback — the
    // callback should only contain queries run against `tx`, so the audit log (a separate,
    // best-effort write via AuditService's own PrismaService instance) doesn't hold a
    // connection open against the transaction's lock while it runs.
    const { report, openedNewCase, moderationCaseId } = await this.prisma.$transaction(async (tx) => {
      // Multiple reports about the same person aggregate into one working case for a
      // moderator, rather than creating a new disconnected case per report — see the
      // schema comment on ModerationCase.
      let moderationCase = await tx.moderationCase.findFirst({
        where: {
          subjectId: dto.subjectId,
          status: { in: [ModerationCaseStatus.OPEN, ModerationCaseStatus.IN_REVIEW] },
        },
      });

      let openedNewCase = false;
      if (!moderationCase) {
        moderationCase = await tx.moderationCase.create({
          data: { subjectId: dto.subjectId },
        });
        openedNewCase = true;
      }

      const report = await tx.report.create({
        data: {
          reporterId,
          subjectId: dto.subjectId,
          reason: dto.reason,
          details: dto.details,
          moderationCaseId: moderationCase.id,
        },
      });

      return { report, openedNewCase, moderationCaseId: moderationCase.id };
    });

    await this.auditService.record({
      actorId: reporterId,
      action: "report.create",
      subjectId: dto.subjectId,
      metadata: { reportId: report.id, reason: dto.reason, moderationCaseId },
    });

    if (openedNewCase) {
      await this.auditService.record({
        action: "moderation.case_open",
        subjectId: dto.subjectId,
        metadata: { moderationCaseId, trigger: "report" },
      });
    }

    return report;
  }

  async listOwn(reporterId: string, query: PaginationQueryDto): Promise<PaginatedResult<unknown>> {
    const where = { reporterId };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.report.findMany({ where, orderBy: { createdAt: "desc" }, skip: query.skip, take: query.take }),
      this.prisma.report.count({ where }),
    ]);
    return paginate(rows, total, query);
  }

  async listAll(query: ListReportsQueryDto): Promise<PaginatedResult<unknown>> {
    const where = query.status ? { status: query.status } : {};
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.report.findMany({
        where,
        orderBy: { createdAt: query.sortDir },
        skip: query.skip,
        take: query.take,
      }),
      this.prisma.report.count({ where }),
    ]);
    return paginate(rows, total, query);
  }

  async resolve(reportId: string, status: typeof ReportStatus.RESOLVED | typeof ReportStatus.DISMISSED, moderatorId: string) {
    const report = await this.prisma.report.findUnique({ where: { id: reportId } });
    if (!report) {
      throw new NotFoundException("Report not found");
    }

    const updated = await this.prisma.report.update({
      where: { id: reportId },
      data: { status, resolvedAt: new Date() },
    });

    await this.auditService.record({
      actorId: moderatorId,
      action: "report.resolve",
      subjectId: report.subjectId,
      metadata: { reportId, newStatus: status },
    });

    return updated;
  }
}
