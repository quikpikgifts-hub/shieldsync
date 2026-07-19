import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { computeAge } from "../common/utils/age.util";
import { safeErrorMessage } from "../common/logging/safe-error";
import type { AppConfig } from "../config/configuration";
import { AccountLockoutService } from "./account-lockout.service";
import { TokenBlacklistService } from "./token-blacklist.service";
import { NotificationEmailService } from "../email/notification-email.service";
import type { RegisterDto } from "./dto/register.dto";
import type { LoginDto } from "./dto/login.dto";

const MINIMUM_AGE_YEARS = 18;

// A precomputed hash of a value nobody will ever type, used to burn roughly the same CPU
// time as a real password verification when the account doesn't exist — otherwise a login
// attempt against an unregistered email returns faster than one against a real email with
// the wrong password, which leaks which emails are registered (a real, exploitable timing
// side-channel, not a theoretical one).
const DUMMY_HASH_PROMISE = argon2.hash(randomBytes(32).toString("hex"));

export interface SessionMetadata {
  ipAddress?: string;
  userAgent?: string;
  deviceFingerprint?: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
}

export interface SafeUser {
  id: string;
  email: string;
  roles: string[];
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly jwtConfig: AppConfig["jwt"];

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
    private readonly accountLockout: AccountLockoutService,
    private readonly tokenBlacklist: TokenBlacklistService,
    private readonly notificationEmail: NotificationEmailService,
  ) {
    this.jwtConfig = this.configService.getOrThrow<AppConfig["jwt"]>("app.jwt");
  }

  async register(dto: RegisterDto, meta: SessionMetadata): Promise<{ user: SafeUser; tokens: TokenPair }> {
    assertMeetsMinimumAge(dto.dateOfBirth);

    const email = normalizeEmail(dto.email);

    const existing = await this.prisma.users.findUnique({ where: { email } });
    if (existing) {
      // Deliberately generic: confirming "this email is already registered" to an
      // unauthenticated caller is itself a (minor, commonly-accepted) enumeration
      // leak, but a clearer UX tradeoff than GDPR-style silence for a signup flow.
      throw new ConflictException("An account with this email already exists.");
    }

    const passwordHash = await argon2.hash(dto.password);

    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.users.create({
        data: {
          email,
          phone: dto.phone,
          passwordHash,
          dateOfBirth: new Date(dto.dateOfBirth),
        },
      });

      const userRole = await tx.role.findUnique({ where: { key: "user" } });
      if (!userRole) {
        throw new Error(
          'Role "user" is missing — run `npm run prisma:seed` before accepting registrations.',
        );
      }

      await tx.userRole.create({ data: { userId: created.id, roleId: userRole.id } });

      return created;
    });

    await this.auditService.record({
      actorId: user.id,
      action: "auth.register",
      subjectId: user.id,
      ipAddress: meta.ipAddress,
    });

    const safeUser: SafeUser = { id: user.id, email: user.email, roles: ["user"] };
    const tokens = await this.issueTokenPair(safeUser, meta);
    return { user: safeUser, tokens };
  }

  async login(dto: LoginDto, meta: SessionMetadata): Promise<{ user: SafeUser; tokens: TokenPair }> {
    const email = normalizeEmail(dto.email);

    // Keyed on the submitted email string itself, before we know whether the account
    // exists — see AccountLockoutService's doc comment on why that's deliberate.
    const lockStatus = await this.accountLockout.checkLocked(email);
    if (lockStatus.locked) {
      throw tooManyAttempts(lockStatus.retryAfterSeconds);
    }

    const user = await this.prisma.users.findUnique({
      where: { email },
      include: { roles: { include: { role: true } } },
    });

    if (!user || user.deletedAt) {
      await argon2.verify(await DUMMY_HASH_PROMISE, dto.password);
      await this.recordLoginFailure(email, undefined, "no_such_account", meta);
      throw new UnauthorizedException("Invalid email or password.");
    }

    const passwordValid = await argon2.verify(user.passwordHash, dto.password);
    if (!passwordValid) {
      await this.recordLoginFailure(email, user.id, "bad_password", meta);
      throw new UnauthorizedException("Invalid email or password.");
    }

    if (user.status !== "ACTIVE") {
      await this.auditService.record({
        actorId: user.id,
        action: "auth.login.failure",
        subjectId: user.id,
        metadata: { reason: "account_not_active", status: user.status },
        ipAddress: meta.ipAddress,
      });
      throw new UnauthorizedException(`This account is ${user.status.toLowerCase()}.`);
    }

    await this.accountLockout.recordSuccess(email);

    await this.auditService.record({
      actorId: user.id,
      action: "auth.login.success",
      subjectId: user.id,
      ipAddress: meta.ipAddress,
    });

    await this.detectAndNotifyNewDevice(user.id, user.email, meta);

    const safeUser: SafeUser = { id: user.id, email: user.email, roles: user.roles.map((r) => r.role.key) };
    const tokens = await this.issueTokenPair(safeUser, meta);
    return { user: safeUser, tokens };
  }

  private async recordLoginFailure(
    email: string,
    userId: string | undefined,
    reason: "no_such_account" | "bad_password",
    meta: SessionMetadata,
  ): Promise<void> {
    await this.auditService.record({
      actorId: userId,
      action: "auth.login.failure",
      subjectId: userId,
      metadata: { reason },
      ipAddress: meta.ipAddress,
    });

    const lockResult = await this.accountLockout.recordFailure(email);
    if (lockResult.locked) {
      await this.auditService.record({
        actorId: userId,
        action: "auth.login.locked_out",
        subjectId: userId,
        metadata: { email, retryAfterSeconds: lockResult.retryAfterSeconds },
        ipAddress: meta.ipAddress,
      });
    }
  }

  /**
   * Rules-based, not ML — a login from a device fingerprint/IP combination never seen
   * before for this account is flagged as an audit event and (if email is configured) a
   * "new sign-in" notification. Deliberately does not block the login or require a second
   * factor — that would be a new user-facing feature (step-up auth), out of scope for this
   * hardening pass — it only makes the event visible, both to the security audit trail and
   * to the account owner.
   */
  private async detectAndNotifyNewDevice(userId: string, email: string, meta: SessionMetadata): Promise<void> {
    const priorSessionCount = await this.prisma.session.count({ where: { userId } });
    if (priorSessionCount === 0) return; // first login ever — nothing to compare against

    const seenBefore = await this.prisma.session.findFirst({
      where: {
        userId,
        OR: [
          ...(meta.deviceFingerprint ? [{ deviceFingerprint: meta.deviceFingerprint }] : []),
          ...(meta.ipAddress ? [{ ipAddress: meta.ipAddress }] : []),
        ],
      },
    });

    if (seenBefore) return;

    await this.auditService.record({
      actorId: userId,
      action: "auth.login.anomaly_new_device",
      subjectId: userId,
      metadata: { ipAddress: meta.ipAddress ?? null, deviceFingerprint: meta.deviceFingerprint ?? null },
      ipAddress: meta.ipAddress,
    });

    try {
      await this.notificationEmail.sendNewDeviceLoginAlert(email, {
        ipAddress: meta.ipAddress ?? "an unknown location",
        userAgent: meta.userAgent ?? "an unknown device",
      });
    } catch (error) {
      // Never fail the login itself over a notification email — see the same reasoning
      // AuditService.record() already applies to its own failures.
      this.logger.error("Failed to send new-device login alert email", safeErrorMessage(error));
    }
  }

  async refresh(rawRefreshToken: string, meta: SessionMetadata): Promise<TokenPair> {
    const tokenHash = hashToken(rawRefreshToken);

    const existing = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { session: true, user: { include: { roles: { include: { role: true } } } } },
    });

    if (!existing) {
      throw new UnauthorizedException("Invalid refresh token.");
    }

    if (existing.revokedAt) {
      // A previously-rotated-out token being presented again means either a replay
      // attack or a client bug that reused a stale token — either way, the safe response
      // is to burn the entire session, not just this token.
      await this.prisma.session.update({
        where: { id: existing.sessionId },
        data: { revokedAt: new Date() },
      });
      await this.prisma.refreshToken.updateMany({
        where: { sessionId: existing.sessionId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      await this.auditService.record({
        actorId: existing.userId,
        action: "auth.token.refresh_reuse_detected",
        subjectId: existing.userId,
        metadata: { sessionId: existing.sessionId },
        ipAddress: meta.ipAddress,
      });
      throw new UnauthorizedException("Refresh token has already been used. Please log in again.");
    }

    if (existing.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException("Refresh token has expired.");
    }

    const newRawToken = randomBytes(48).toString("hex");
    const newTokenHash = hashToken(newRawToken);
    const expiresAt = addDays(new Date(), this.jwtConfig.refreshTtlDays);

    await this.prisma.$transaction([
      this.prisma.refreshToken.update({
        where: { id: existing.id },
        data: { revokedAt: new Date(), replacedByTokenHash: newTokenHash },
      }),
      this.prisma.refreshToken.create({
        data: {
          sessionId: existing.sessionId,
          userId: existing.userId,
          tokenHash: newTokenHash,
          expiresAt,
        },
      }),
      this.prisma.session.update({
        where: { id: existing.sessionId },
        data: { lastSeenAt: new Date() },
      }),
    ]);

    await this.auditService.record({
      actorId: existing.userId,
      action: "auth.token.refresh",
      subjectId: existing.userId,
      ipAddress: meta.ipAddress,
    });

    const roles = existing.user.roles.map((r) => r.role.key);
    const accessToken = await this.signAccessToken({ id: existing.userId, email: existing.user.email, roles });

    return { accessToken, refreshToken: newRawToken, expiresInSeconds: accessTtlToSeconds(this.jwtConfig.accessTtl) };
  }

  async logout(rawRefreshToken: string, caller: { id: string; jti: string; exp: number }): Promise<void> {
    const tokenHash = hashToken(rawRefreshToken);
    const existing = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });

    // Blacklist the caller's *own* presented access token regardless of whether the
    // refresh token below turns out to be valid/owned — logout should always kill the
    // token that was just used to authenticate the call, even if the client sent a stale
    // or already-revoked refreshToken alongside it.
    await this.tokenBlacklist.blacklist(caller.jti, caller.exp - Math.floor(Date.now() / 1000));

    if (!existing) {
      return; // Already logged out / invalid token — logout is idempotent, not an error.
    }

    // Defense in depth: /auth/logout is authenticated, so the caller has already proven
    // who they are via their own access token. That caller should only ever be able to
    // revoke a session that belongs to them — never someone else's, even though the raw
    // refresh token itself (48 random bytes) is already effectively unguessable.
    if (existing.userId !== caller.id) {
      return; // Same idempotent no-op as an unknown token — no information leaked either way.
    }

    await this.prisma.$transaction([
      this.prisma.refreshToken.update({ where: { id: existing.id }, data: { revokedAt: new Date() } }),
      this.prisma.session.update({ where: { id: existing.sessionId }, data: { revokedAt: new Date() } }),
    ]);

    await this.auditService.record({
      actorId: existing.userId,
      action: "auth.logout",
      subjectId: existing.userId,
    });
  }

  private async issueTokenPair(user: SafeUser, meta: SessionMetadata): Promise<TokenPair> {
    const session = await this.prisma.session.create({
      data: {
        userId: user.id,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
        deviceFingerprint: meta.deviceFingerprint,
      },
    });

    const rawRefreshToken = randomBytes(48).toString("hex");
    const expiresAt = addDays(new Date(), this.jwtConfig.refreshTtlDays);

    await this.prisma.refreshToken.create({
      data: {
        sessionId: session.id,
        userId: user.id,
        tokenHash: hashToken(rawRefreshToken),
        expiresAt,
      },
    });

    const accessToken = await this.signAccessToken(user);
    return {
      accessToken,
      refreshToken: rawRefreshToken,
      expiresInSeconds: accessTtlToSeconds(this.jwtConfig.accessTtl),
    };
  }

  private async signAccessToken(user: SafeUser): Promise<string> {
    // Passed as a number of seconds rather than the configured string ("15m") — the
    // installed jsonwebtoken type definitions require a branded `StringValue` type for
    // the string form that a plain `string` variable can't satisfy, and a numeric
    // seconds value is unambiguous and accepted regardless.
    // `jti` (a random per-token ID, distinct from the session/refresh-token IDs) is what
    // makes TokenBlacklistService able to invalidate one specific access token on logout
    // without needing to track every issued token — see its doc comment.
    return this.jwtService.signAsync(
      { sub: user.id, email: user.email, roles: user.roles, jti: randomUUID() },
      { secret: this.jwtConfig.accessSecret, expiresIn: accessTtlToSeconds(this.jwtConfig.accessTtl) },
    );
  }
}

function tooManyAttempts(retryAfterSeconds: number | undefined): HttpException {
  return new HttpException(
    {
      statusCode: HttpStatus.TOO_MANY_REQUESTS,
      message: "Too many failed login attempts. Please try again later.",
      retryAfterSeconds: retryAfterSeconds ?? null,
    },
    HttpStatus.TOO_MANY_REQUESTS,
  );
}

// Emails are case-insensitive per RFC 5321's common real-world convention (and every
// mainstream mail provider treats them that way), but without normalization at the
// storage/lookup boundary, "User@x.com" and "user@x.com" would silently register two
// different accounts and a legitimate login could fail purely on casing.
function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function accessTtlToSeconds(ttl: string): number {
  const match = /^(\d+)([smhd])$/.exec(ttl);
  if (!match) return 900; // 15m fallback if the configured value is malformed
  const value = parseInt(match[1], 10);
  const unit = match[2];
  const multiplier = { s: 1, m: 60, h: 3600, d: 86400 }[unit] ?? 60;
  return value * multiplier;
}

function assertMeetsMinimumAge(dateOfBirthIso: string): void {
  const dob = new Date(dateOfBirthIso);
  if (Number.isNaN(dob.getTime())) {
    throw new BadRequestException("dateOfBirth is not a valid date.");
  }
  // Uses the same whole-years calculation as computeAge() (common/utils/age.util.ts) —
  // the two must never drift, since one gates registration and the other is what every
  // other part of the product displays as "age".
  if (computeAge(dob) < MINIMUM_AGE_YEARS) {
    // Self-attested DOB is a known-weak control — see docs/ember/OPEN_DECISIONS.md
    // and R-01 in THREAT_MODEL.md. This check exists so the system enforces *something*
    // at signup rather than nothing, not because it is considered sufficient on its own.
    throw new BadRequestException(`You must be at least ${MINIMUM_AGE_YEARS} to register.`);
  }
}
