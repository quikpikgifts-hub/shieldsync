import { Inject, Injectable, Logger } from "@nestjs/common";
import { BadRequestException, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as argon2 from "argon2";
import { createHash, randomBytes } from "node:crypto";
import { VerificationTokenPurpose } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { NotificationEmailService } from "../email/notification-email.service";
import { KEY_VALUE_STORE, type KeyValueStore } from "../redis/key-value-store.interface";
import type { AppConfig } from "../config/configuration";
import type { SessionMetadata } from "./auth.service";

const EMAIL_VERIFICATION_TTL_HOURS = 24;
const PASSWORD_RESET_TTL_MINUTES = 30;

// Password-reset abuse protection (task priority 6): caps how many reset emails one
// address can trigger per hour, independent of who's asking — this stops an attacker from
// email-bombing a victim's inbox by repeatedly requesting resets for their address, which
// the IP-based @Throttle on the route alone doesn't prevent (attacker can rotate IPs).
const PASSWORD_RESET_MAX_PER_HOUR = 3;
const PASSWORD_RESET_WINDOW_SECONDS = 60 * 60;

@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);
  private readonly frontendBaseUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly notificationEmail: NotificationEmailService,
    @Inject(KEY_VALUE_STORE) private readonly keyValueStore: KeyValueStore,
    configService: ConfigService,
  ) {
    this.frontendBaseUrl = configService.getOrThrow<AppConfig["frontendBaseUrl"]>("app.frontendBaseUrl");
  }

  async requestEmailVerification(userId: string): Promise<void> {
    const user = await this.prisma.users.findUnique({ where: { id: userId } });
    if (!user || user.deletedAt) {
      throw new BadRequestException("Account not found.");
    }
    if (user.emailVerifiedAt) {
      return; // already verified — idempotent no-op, not an error
    }

    const rawToken = await this.issueToken(userId, VerificationTokenPurpose.EMAIL_VERIFY, EMAIL_VERIFICATION_TTL_HOURS * 60);
    const link = `${this.frontendBaseUrl}/verify-email?token=${rawToken}`;

    await this.auditService.record({
      actorId: userId,
      action: "auth.email_verification.requested",
      subjectId: userId,
    });

    await this.notificationEmail.sendVerificationEmail(user.email, link, EMAIL_VERIFICATION_TTL_HOURS);
  }

  async verifyEmail(rawToken: string): Promise<void> {
    const token = await this.consumeToken(rawToken, VerificationTokenPurpose.EMAIL_VERIFY);

    await this.prisma.users.update({ where: { id: token.userId }, data: { emailVerifiedAt: new Date() } });

    await this.auditService.record({
      actorId: token.userId,
      action: "auth.email_verification.completed",
      subjectId: token.userId,
    });
  }

  /**
   * Deliberately returns the same result (nothing — void, generic success) whether or not
   * the email corresponds to a real account, matching login's anti-enumeration stance:
   * a caller can't tell "no such account" apart from "account exists, email sent" apart
   * from "rate limited" by the response alone.
   */
  async requestPasswordReset(rawEmail: string, meta: SessionMetadata): Promise<void> {
    const email = rawEmail.trim().toLowerCase();

    const requestCount = await this.keyValueStore.incrWithExpiry(
      `pwreset:request:${email}`,
      PASSWORD_RESET_WINDOW_SECONDS,
    );
    if (requestCount > PASSWORD_RESET_MAX_PER_HOUR) {
      this.logger.warn(`Password reset request rate-limited for ${email}`);
      return;
    }

    const user = await this.prisma.users.findUnique({ where: { email } });
    if (!user || user.deletedAt || user.status !== "ACTIVE") {
      return; // no account, or not eligible to log in anyway — silently no-op
    }

    const rawToken = await this.issueToken(user.id, VerificationTokenPurpose.PASSWORD_RESET, PASSWORD_RESET_TTL_MINUTES);
    const link = `${this.frontendBaseUrl}/reset-password?token=${rawToken}`;

    await this.auditService.record({
      actorId: user.id,
      action: "auth.password_reset.requested",
      subjectId: user.id,
      ipAddress: meta.ipAddress,
    });

    await this.notificationEmail.sendPasswordResetEmail(user.email, link, PASSWORD_RESET_TTL_MINUTES);
  }

  async resetPassword(rawToken: string, newPassword: string, meta: SessionMetadata): Promise<void> {
    const token = await this.consumeToken(rawToken, VerificationTokenPurpose.PASSWORD_RESET);
    const passwordHash = await argon2.hash(newPassword);

    // Resetting the password revokes every existing session/refresh token for the
    // account — if the reset was triggered because of a compromise, leaving old sessions
    // alive after a "successful" reset would defeat the point of resetting at all.
    await this.prisma.$transaction([
      this.prisma.users.update({ where: { id: token.userId }, data: { passwordHash } }),
      this.prisma.session.updateMany({ where: { userId: token.userId, revokedAt: null }, data: { revokedAt: new Date() } }),
      this.prisma.refreshToken.updateMany({
        where: { userId: token.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    await this.auditService.record({
      actorId: token.userId,
      action: "auth.password_reset.completed",
      subjectId: token.userId,
      ipAddress: meta.ipAddress,
    });
  }

  private async issueToken(userId: string, purpose: VerificationTokenPurpose, ttlMinutes: number): Promise<string> {
    const rawToken = randomBytes(32).toString("hex");
    await this.prisma.verificationToken.create({
      data: {
        userId,
        purpose,
        tokenHash: hashToken(rawToken),
        expiresAt: new Date(Date.now() + ttlMinutes * 60 * 1000),
      },
    });
    return rawToken;
  }

  private async consumeToken(
    rawToken: string,
    purpose: VerificationTokenPurpose,
  ): Promise<{ userId: string }> {
    const tokenHash = hashToken(rawToken);
    const token = await this.prisma.verificationToken.findUnique({ where: { tokenHash } });

    if (!token || token.purpose !== purpose || token.usedAt || token.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException("This link is invalid or has expired.");
    }

    await this.prisma.verificationToken.update({ where: { id: token.id }, data: { usedAt: new Date() } });

    return { userId: token.userId };
  }
}

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}
