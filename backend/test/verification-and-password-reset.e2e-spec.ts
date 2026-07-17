import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { configureApp } from "../src/configure-app";
import { PrismaService } from "../src/prisma/prisma.service";
import { NotificationEmailService } from "../src/email/notification-email.service";
import { resetDatabase } from "./db-test-utils";
import { registerUser } from "./test-helpers";

// The SMTP transport layer itself is verified for real against a live local SMTP server in
// src/integrations/email/smtp-email.provider.spec.ts. Here, NotificationEmailService is
// swapped for a capturing fake so these tests exercise the actual endpoint/business logic
// (token issuance, expiry, single-use enforcement, session revocation on reset) without
// needing SMTP configured for the whole app — a standard test-boundary split, not a gap.
describe("Email verification & password reset (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let fakeEmail: {
    sendVerificationEmail: jest.Mock;
    sendPasswordResetEmail: jest.Mock;
    sendNewDeviceLoginAlert: jest.Mock;
  };

  beforeAll(async () => {
    fakeEmail = {
      sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
      sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
      sendNewDeviceLoginAlert: jest.fn().mockResolvedValue(undefined),
    };

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(NotificationEmailService)
      .useValue(fakeEmail)
      .compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  function linkToken(link: string): string {
    return new URL(link).searchParams.get("token")!;
  }

  describe("Email verification", () => {
    it("sends a verification link and confirming it sets emailVerifiedAt", async () => {
      const user = await registerUser(app);

      const requestRes = await request(app.getHttpServer())
        .post("/auth/email/verification/request")
        .set("Authorization", `Bearer ${user.accessToken}`);
      expect(requestRes.status).toBe(204);
      expect(fakeEmail.sendVerificationEmail).toHaveBeenCalledTimes(1);
      const [to, link] = fakeEmail.sendVerificationEmail.mock.calls[0];
      expect(to).toBe(user.email);

      const before = await request(app.getHttpServer()).get("/users/me").set("Authorization", `Bearer ${user.accessToken}`);
      expect(before.body.emailVerifiedAt).toBeNull();

      const confirmRes = await request(app.getHttpServer())
        .post("/auth/email/verification/confirm")
        .send({ token: linkToken(link) });
      expect(confirmRes.status).toBe(204);

      const after = await request(app.getHttpServer()).get("/users/me").set("Authorization", `Bearer ${user.accessToken}`);
      expect(after.body.emailVerifiedAt).not.toBeNull();
    });

    it("rejects reusing an already-consumed verification token", async () => {
      const user = await registerUser(app);
      await request(app.getHttpServer())
        .post("/auth/email/verification/request")
        .set("Authorization", `Bearer ${user.accessToken}`);
      const [, link] = fakeEmail.sendVerificationEmail.mock.calls[0];
      const token = linkToken(link);

      await request(app.getHttpServer()).post("/auth/email/verification/confirm").send({ token });
      const secondAttempt = await request(app.getHttpServer()).post("/auth/email/verification/confirm").send({ token });
      expect(secondAttempt.status).toBe(401);
    });

    it("rejects a garbage verification token", async () => {
      const res = await request(app.getHttpServer())
        .post("/auth/email/verification/confirm")
        .send({ token: "not-a-real-token" });
      expect(res.status).toBe(401);
    });

    it("requires authentication to request a verification email", async () => {
      const res = await request(app.getHttpServer()).post("/auth/email/verification/request");
      expect(res.status).toBe(401);
    });
  });

  describe("Password reset", () => {
    it("resets the password and revokes every prior session", async () => {
      const user = await registerUser(app);

      const requestRes = await request(app.getHttpServer())
        .post("/auth/password-reset/request")
        .send({ email: user.email });
      expect(requestRes.status).toBe(204);
      expect(fakeEmail.sendPasswordResetEmail).toHaveBeenCalledTimes(1);
      const [, link] = fakeEmail.sendPasswordResetEmail.mock.calls[0];

      const confirmRes = await request(app.getHttpServer())
        .post("/auth/password-reset/confirm")
        .send({ token: linkToken(link), newPassword: "brandNewPassw0rd" });
      expect(confirmRes.status).toBe(204);

      // The old refresh token must no longer work — resetting the password revokes every
      // existing session, not just future logins.
      const refreshRes = await request(app.getHttpServer())
        .post("/auth/refresh")
        .send({ refreshToken: user.refreshToken });
      expect(refreshRes.status).toBe(401);

      // The new password works; the old one doesn't.
      const oldPasswordLogin = await request(app.getHttpServer())
        .post("/auth/login")
        .send({ email: user.email, password: "correcthorse123" });
      expect(oldPasswordLogin.status).toBe(401);

      const newPasswordLogin = await request(app.getHttpServer())
        .post("/auth/login")
        .send({ email: user.email, password: "brandNewPassw0rd" });
      expect(newPasswordLogin.status).toBe(200);
    });

    it("returns 204 for a nonexistent email without sending anything (anti-enumeration)", async () => {
      const res = await request(app.getHttpServer())
        .post("/auth/password-reset/request")
        .send({ email: "nobody-at-all@example.com" });
      expect(res.status).toBe(204);
      expect(fakeEmail.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it("rejects a garbage reset token", async () => {
      const res = await request(app.getHttpServer())
        .post("/auth/password-reset/confirm")
        .send({ token: "not-a-real-token", newPassword: "brandNewPassw0rd" });
      expect(res.status).toBe(401);
    });

    it("rejects a weak new password", async () => {
      const user = await registerUser(app);
      await request(app.getHttpServer()).post("/auth/password-reset/request").send({ email: user.email });
      const [, link] = fakeEmail.sendPasswordResetEmail.mock.calls[0];

      const res = await request(app.getHttpServer())
        .post("/auth/password-reset/confirm")
        .send({ token: linkToken(link), newPassword: "short" });
      expect(res.status).toBe(400);
    });
  });
});
