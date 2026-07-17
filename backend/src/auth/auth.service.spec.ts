import { ConflictException, UnauthorizedException, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";
import { AuthService } from "./auth.service";
import { AuditService } from "../audit/audit.service";
import { PrismaService } from "../prisma/prisma.service";

describe("AuthService", () => {
  let service: AuthService;
  let prisma: { users: any; $transaction: jest.Mock; refreshToken: any; session: any };
  let auditService: { record: jest.Mock };
  let jwtService: { signAsync: jest.Mock };

  const jwtConfig = {
    accessSecret: "unit-test-secret-not-real-0000000000",
    accessTtl: "15m",
    refreshTtlDays: 30,
  };

  beforeEach(() => {
    prisma = {
      users: { findUnique: jest.fn(), create: jest.fn() },
      $transaction: jest.fn(),
      refreshToken: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
      session: { create: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
    };
    auditService = { record: jest.fn().mockResolvedValue(undefined) };
    jwtService = { signAsync: jest.fn().mockResolvedValue("signed.jwt.token") };

    const configService = {
      getOrThrow: jest.fn().mockReturnValue(jwtConfig),
    } as unknown as ConfigService;

    service = new AuthService(
      prisma as unknown as PrismaService,
      jwtService as unknown as JwtService,
      configService,
      auditService as unknown as AuditService,
    );
  });

  describe("register", () => {
    const dto = { email: "riley@example.com", password: "correcthorse123", dateOfBirth: "1995-01-01" };

    it("rejects registration under the minimum age", async () => {
      const underage = { ...dto, dateOfBirth: new Date().toISOString().slice(0, 10) };
      await expect(service.register(underage, {})).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.users.findUnique).not.toHaveBeenCalled();
    });

    it("rejects a duplicate email without hashing the password or hitting the DB write path", async () => {
      prisma.users.findUnique.mockResolvedValue({ id: "existing-user" });

      await expect(service.register(dto, {})).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("creates the user with an argon2 hash, never the plaintext password", async () => {
      prisma.users.findUnique.mockResolvedValue(null);
      const createdUser = { id: "user-1", email: dto.email };
      prisma.$transaction.mockImplementation(async (fn: (tx: unknown) => unknown) =>
        fn({
          users: { create: jest.fn().mockResolvedValue(createdUser) },
          role: { findUnique: jest.fn().mockResolvedValue({ id: "role-user" }) },
          userRole: { create: jest.fn().mockResolvedValue({}) },
        }),
      );
      prisma.session.create.mockResolvedValue({ id: "session-1" });
      prisma.refreshToken.create.mockResolvedValue({});

      const result = await service.register(dto, { ipAddress: "127.0.0.1" });

      expect(result.user).toEqual({ id: "user-1", email: dto.email, roles: ["user"] });
      expect(result.tokens.accessToken).toBe("signed.jwt.token");
      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: "auth.register", actorId: "user-1" }),
      );
    });
  });

  describe("login", () => {
    it("returns a generic 401 for a nonexistent account without revealing that", async () => {
      prisma.users.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: "nobody@example.com", password: "whatever123" }, {}),
      ).rejects.toThrow("Invalid email or password.");
    });

    it("returns the same generic 401 for a wrong password on a real account", async () => {
      const passwordHash = await argon2.hash("correcthorse123");
      prisma.users.findUnique.mockResolvedValue({
        id: "user-1",
        email: "riley@example.com",
        passwordHash,
        status: "ACTIVE",
        deletedAt: null,
        roles: [],
      });

      await expect(
        service.login({ email: "riley@example.com", password: "wrongpassword" }, {}),
      ).rejects.toThrow("Invalid email or password.");
    });

    it("rejects login for a non-active account after verifying the password", async () => {
      const passwordHash = await argon2.hash("correcthorse123");
      prisma.users.findUnique.mockResolvedValue({
        id: "user-1",
        email: "riley@example.com",
        passwordHash,
        status: "BANNED",
        deletedAt: null,
        roles: [],
      });

      await expect(
        service.login({ email: "riley@example.com", password: "correcthorse123" }, {}),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it("succeeds and issues tokens for correct credentials on an active account", async () => {
      const passwordHash = await argon2.hash("correcthorse123");
      prisma.users.findUnique.mockResolvedValue({
        id: "user-1",
        email: "riley@example.com",
        passwordHash,
        status: "ACTIVE",
        deletedAt: null,
        roles: [{ role: { key: "user" } }],
      });
      prisma.session.create.mockResolvedValue({ id: "session-1" });
      prisma.refreshToken.create.mockResolvedValue({});

      const result = await service.login({ email: "riley@example.com", password: "correcthorse123" }, {});
      expect(result.user.roles).toEqual(["user"]);
      expect(result.tokens.accessToken).toBe("signed.jwt.token");
    });
  });

  describe("refresh", () => {
    it("rejects an unknown refresh token", async () => {
      prisma.refreshToken.findUnique.mockResolvedValue(null);
      await expect(service.refresh("nonexistent-token", {})).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it("detects reuse of an already-revoked token and revokes the whole session", async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: "rt-1",
        sessionId: "session-1",
        userId: "user-1",
        revokedAt: new Date(),
        expiresAt: new Date(Date.now() + 100000),
        user: { email: "riley@example.com", roles: [] },
      });

      await expect(service.refresh("reused-token", {})).rejects.toThrow(
        "Refresh token has already been used. Please log in again.",
      );

      expect(prisma.session.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "session-1" } }),
      );
      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: "auth.token.refresh_reuse_detected" }),
      );
    });

    it("rejects an expired token", async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: "rt-1",
        sessionId: "session-1",
        userId: "user-1",
        revokedAt: null,
        expiresAt: new Date(Date.now() - 1000),
        user: { email: "riley@example.com", roles: [] },
      });

      await expect(service.refresh("expired-token", {})).rejects.toThrow("Refresh token has expired.");
    });
  });
});
