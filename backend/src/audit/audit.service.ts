import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { safeErrorMessage } from "../common/logging/safe-error";

// Keeping this a closed union (rather than `string`) means every call site is checked
// at compile time, and grepping this file tells you every auditable action in the system.
export type AuditAction =
  | "auth.register"
  | "auth.login.success"
  | "auth.login.failure"
  | "auth.login.locked_out"
  | "auth.login.anomaly_new_device"
  | "auth.logout"
  | "auth.token.refresh"
  | "auth.token.refresh_reuse_detected"
  | "auth.email_verification.requested"
  | "auth.email_verification.completed"
  | "auth.password_reset.requested"
  | "auth.password_reset.completed"
  | "profile.pii_view"
  | "user.role_change"
  | "user.status_change"
  | "report.create"
  | "report.resolve"
  | "block.create"
  | "moderation.case_open"
  | "moderation.case_assign"
  | "moderation.action_taken"
  | "like.create"
  | "match.create";

export interface RecordAuditEntryInput {
  actorId?: string | null;
  action: AuditAction;
  subjectId?: string | null;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
}

/**
 * Append-only by contract: this service intentionally exposes no update/delete method.
 * Full tamper-resistance also requires revoking UPDATE/DELETE grants on `audit_logs` for
 * the application's database role — see docs/ember/SECURITY_NOTES.md for that follow-up,
 * which needs a deployment-time step this local dev setup doesn't perform.
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async record(entry: RecordAuditEntryInput): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          actorId: entry.actorId ?? null,
          action: entry.action,
          subjectId: entry.subjectId ?? null,
          metadata: entry.metadata as never,
          ipAddress: entry.ipAddress ?? null,
        },
      });
    } catch (error) {
      // Audit logging must never take down the request it's observing, but a failure
      // here is itself a security-relevant event — surface it loudly to application logs.
      this.logger.error(`Failed to write audit log for action "${entry.action}"`, safeErrorMessage(error));
    }
  }
}
