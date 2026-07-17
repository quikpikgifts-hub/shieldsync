import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { configureApp } from "../src/configure-app";
import { PrismaService } from "../src/prisma/prisma.service";
import { resetDatabase } from "./db-test-utils";
import { registerUser } from "./test-helpers";

describe("Safety (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  async function grantRole(userId: string, roleKey: string): Promise<void> {
    const role = await prisma.role.findUniqueOrThrow({ where: { key: roleKey } });
    await prisma.userRole.create({ data: { userId, roleId: role.id } });
  }

  describe("Reports", () => {
    it("lets a user report another user and opens a moderation case", async () => {
      const reporter = await registerUser(app);
      const subject = await registerUser(app);

      const res = await request(app.getHttpServer())
        .post("/reports")
        .set("Authorization", `Bearer ${reporter.accessToken}`)
        .send({ subjectId: subject.id, reason: "HARASSMENT", details: "unwanted messages" });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe("OPEN");
      expect(res.body.moderationCaseId).toEqual(expect.any(String));
    });

    it("rejects reporting yourself", async () => {
      const user = await registerUser(app);
      const res = await request(app.getHttpServer())
        .post("/reports")
        .set("Authorization", `Bearer ${user.accessToken}`)
        .send({ subjectId: user.id, reason: "OTHER" });
      expect(res.status).toBe(400);
    });

    it("aggregates a second report about the same subject into the existing open case", async () => {
      const reporterA = await registerUser(app);
      const reporterB = await registerUser(app);
      const subject = await registerUser(app);

      const first = await request(app.getHttpServer())
        .post("/reports")
        .set("Authorization", `Bearer ${reporterA.accessToken}`)
        .send({ subjectId: subject.id, reason: "SCAM_OR_FRAUD" });

      const second = await request(app.getHttpServer())
        .post("/reports")
        .set("Authorization", `Bearer ${reporterB.accessToken}`)
        .send({ subjectId: subject.id, reason: "HARASSMENT" });

      expect(second.body.moderationCaseId).toBe(first.body.moderationCaseId);
    });

    it("forbids a plain user from listing all reports", async () => {
      const user = await registerUser(app);
      const res = await request(app.getHttpServer())
        .get("/reports")
        .set("Authorization", `Bearer ${user.accessToken}`);
      expect(res.status).toBe(403);
    });

    it("allows a moderator to list and resolve reports", async () => {
      const reporter = await registerUser(app);
      const subject = await registerUser(app);
      const moderator = await registerUser(app);
      await grantRole(moderator.id, "moderator");

      const reportRes = await request(app.getHttpServer())
        .post("/reports")
        .set("Authorization", `Bearer ${reporter.accessToken}`)
        .send({ subjectId: subject.id, reason: "FAKE_PROFILE" });

      const listRes = await request(app.getHttpServer())
        .get("/reports")
        .set("Authorization", `Bearer ${moderator.accessToken}`);
      expect(listRes.status).toBe(200);
      expect(listRes.body.total).toBe(1);

      const resolveRes = await request(app.getHttpServer())
        .patch(`/reports/${reportRes.body.id}/resolve`)
        .set("Authorization", `Bearer ${moderator.accessToken}`)
        .send({ status: "DISMISSED" });
      expect(resolveRes.status).toBe(200);
      expect(resolveRes.body.status).toBe("DISMISSED");
    });
  });

  describe("Blocks", () => {
    it("lets a user block another and prevents further messaging (covered in matching spec)", async () => {
      const blocker = await registerUser(app);
      const blocked = await registerUser(app);

      const res = await request(app.getHttpServer())
        .post("/blocks")
        .set("Authorization", `Bearer ${blocker.accessToken}`)
        .send({ blockedId: blocked.id });
      expect(res.status).toBe(201);

      const listRes = await request(app.getHttpServer())
        .get("/blocks")
        .set("Authorization", `Bearer ${blocker.accessToken}`);
      expect(listRes.body).toHaveLength(1);
    });

    it("rejects blocking yourself", async () => {
      const user = await registerUser(app);
      const res = await request(app.getHttpServer())
        .post("/blocks")
        .set("Authorization", `Bearer ${user.accessToken}`)
        .send({ blockedId: user.id });
      expect(res.status).toBe(400);
    });
  });

  describe("Moderation cases", () => {
    it("suspends the reported user's account and revokes their sessions on a BANNED resolution", async () => {
      const reporter = await registerUser(app);
      const subject = await registerUser(app);
      const moderator = await registerUser(app);
      await grantRole(moderator.id, "moderator");

      const reportRes = await request(app.getHttpServer())
        .post("/reports")
        .set("Authorization", `Bearer ${reporter.accessToken}`)
        .send({ subjectId: subject.id, reason: "SCAM_OR_FRAUD" });

      const caseId = reportRes.body.moderationCaseId;

      const resolveRes = await request(app.getHttpServer())
        .patch(`/moderation-cases/${caseId}/resolve`)
        .set("Authorization", `Bearer ${moderator.accessToken}`)
        .send({ action: "BANNED", notes: "Confirmed romance scam pattern." });
      expect(resolveRes.status).toBe(200);

      const bannedUser = await prisma.users.findUniqueOrThrow({ where: { id: subject.id } });
      expect(bannedUser.status).toBe("BANNED");

      // The subject's pre-ban access token must no longer work for a refresh — their
      // session was revoked as part of the ban, not just their account status flipped.
      const refreshRes = await request(app.getHttpServer())
        .post("/auth/refresh")
        .send({ refreshToken: subject.refreshToken });
      expect(refreshRes.status).toBe(401);
    });
  });
});
