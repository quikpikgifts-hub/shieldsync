import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { configureApp } from "../src/configure-app";
import { PrismaService } from "../src/prisma/prisma.service";
import { resetDatabase } from "./db-test-utils";
import { registerUser, createProfile } from "./test-helpers";

describe("Matching & Messaging (e2e)", () => {
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

  describe("GET /matching/candidates", () => {
    it("excludes yourself, already-decided users, blocked users, and profile-less users", async () => {
      const viewer = await registerUser(app);
      const noProfile = await registerUser(app); // never creates a profile
      const candidate = await registerUser(app);
      await createProfile(app, candidate.accessToken, { displayName: "Candidate" });
      const alreadyPassed = await registerUser(app);
      await createProfile(app, alreadyPassed.accessToken, { displayName: "Already Passed" });
      const blocked = await registerUser(app);
      await createProfile(app, blocked.accessToken, { displayName: "Blocked" });

      await request(app.getHttpServer())
        .post("/matching/likes")
        .set("Authorization", `Bearer ${viewer.accessToken}`)
        .send({ targetId: alreadyPassed.id, action: "PASS" });

      await request(app.getHttpServer())
        .post("/blocks")
        .set("Authorization", `Bearer ${viewer.accessToken}`)
        .send({ blockedId: blocked.id });

      const res = await request(app.getHttpServer())
        .get("/matching/candidates")
        .set("Authorization", `Bearer ${viewer.accessToken}`);

      expect(res.status).toBe(200);
      const ids = res.body.map((c: { userId: string }) => c.userId);
      expect(ids).toContain(candidate.id);
      expect(ids).not.toContain(viewer.id);
      expect(ids).not.toContain(noProfile.id);
      expect(ids).not.toContain(alreadyPassed.id);
      expect(ids).not.toContain(blocked.id);
    });

    it("never includes a fabricated compatibility score", async () => {
      const viewer = await registerUser(app);
      const candidate = await registerUser(app);
      await createProfile(app, candidate.accessToken);

      const res = await request(app.getHttpServer())
        .get("/matching/candidates")
        .set("Authorization", `Bearer ${viewer.accessToken}`);

      for (const entry of res.body) {
        expect(entry).not.toHaveProperty("compat");
        expect(entry).not.toHaveProperty("compatibilityScore");
      }
    });

    it("respects the caller's age preferences", async () => {
      const viewer = await registerUser(app);
      await request(app.getHttpServer())
        .put("/profiles/me/preferences")
        .set("Authorization", `Bearer ${viewer.accessToken}`)
        .send({ ageMin: 40, ageMax: 50 });

      const youngCandidate = await registerUser(app, { dateOfBirth: "2000-01-01" }); // ~26
      await createProfile(app, youngCandidate.accessToken);
      const inRangeCandidate = await registerUser(app, { dateOfBirth: "1980-01-01" }); // ~46
      await createProfile(app, inRangeCandidate.accessToken);

      const res = await request(app.getHttpServer())
        .get("/matching/candidates")
        .set("Authorization", `Bearer ${viewer.accessToken}`);

      const ids = res.body.map((c: { userId: string }) => c.userId);
      expect(ids).toContain(inRangeCandidate.id);
      expect(ids).not.toContain(youngCandidate.id);
    });
  });

  it("does not create a match on a one-sided like", async () => {
    const a = await registerUser(app);
    const b = await registerUser(app);

    const res = await request(app.getHttpServer())
      .post("/matching/likes")
      .set("Authorization", `Bearer ${a.accessToken}`)
      .send({ targetId: b.id, action: "LIKE" });

    expect(res.status).toBe(201);
    expect(res.body.match).toBeNull();
  });

  it("creates exactly one match and one conversation on a reciprocal like", async () => {
    const a = await registerUser(app);
    const b = await registerUser(app);

    await request(app.getHttpServer())
      .post("/matching/likes")
      .set("Authorization", `Bearer ${a.accessToken}`)
      .send({ targetId: b.id, action: "LIKE" });

    const secondRes = await request(app.getHttpServer())
      .post("/matching/likes")
      .set("Authorization", `Bearer ${b.accessToken}`)
      .send({ targetId: a.id, action: "LIKE" });

    expect(secondRes.body.match).not.toBeNull();

    const matchCount = await prisma.match.count();
    const conversationCount = await prisma.conversation.count();
    expect(matchCount).toBe(1);
    expect(conversationCount).toBe(1);
  });

  it("rejects liking yourself", async () => {
    const a = await registerUser(app);
    const res = await request(app.getHttpServer())
      .post("/matching/likes")
      .set("Authorization", `Bearer ${a.accessToken}`)
      .send({ targetId: a.id, action: "LIKE" });
    expect(res.status).toBe(400);
  });

  it("prevents liking a user you've blocked", async () => {
    const a = await registerUser(app);
    const b = await registerUser(app);

    await request(app.getHttpServer())
      .post("/blocks")
      .set("Authorization", `Bearer ${a.accessToken}`)
      .send({ blockedId: b.id });

    const res = await request(app.getHttpServer())
      .post("/matching/likes")
      .set("Authorization", `Bearer ${a.accessToken}`)
      .send({ targetId: b.id, action: "LIKE" });
    expect(res.status).toBe(403);
  });

  describe("messaging within a match", () => {
    async function createMatch() {
      const a = await registerUser(app);
      const b = await registerUser(app);
      await request(app.getHttpServer())
        .post("/matching/likes")
        .set("Authorization", `Bearer ${a.accessToken}`)
        .send({ targetId: b.id, action: "LIKE" });
      const res = await request(app.getHttpServer())
        .post("/matching/likes")
        .set("Authorization", `Bearer ${b.accessToken}`)
        .send({ targetId: a.id, action: "LIKE" });
      return { a, b, matchId: res.body.match.id as string };
    }

    it("lets both matched users send and read messages", async () => {
      const { a, b, matchId } = await createMatch();

      const sendRes = await request(app.getHttpServer())
        .post(`/conversations/${matchId}/messages`)
        .set("Authorization", `Bearer ${a.accessToken}`)
        .send({ kind: "TEXT", body: "hello!" });
      expect(sendRes.status).toBe(201);

      const listRes = await request(app.getHttpServer())
        .get(`/conversations/${matchId}/messages`)
        .set("Authorization", `Bearer ${b.accessToken}`);
      expect(listRes.body.items).toHaveLength(1);
      expect(listRes.body.items[0].body).toBe("hello!");
    });

    it("forbids a third party from reading or sending in someone else's conversation", async () => {
      const { matchId } = await createMatch();
      const outsider = await registerUser(app);

      const listRes = await request(app.getHttpServer())
        .get(`/conversations/${matchId}/messages`)
        .set("Authorization", `Bearer ${outsider.accessToken}`);
      expect(listRes.status).toBe(403);

      const sendRes = await request(app.getHttpServer())
        .post(`/conversations/${matchId}/messages`)
        .set("Authorization", `Bearer ${outsider.accessToken}`)
        .send({ kind: "TEXT", body: "hi" });
      expect(sendRes.status).toBe(403);
    });

    it("blocks messaging after either party blocks the other post-match", async () => {
      const { a, b, matchId } = await createMatch();

      await request(app.getHttpServer())
        .post("/blocks")
        .set("Authorization", `Bearer ${b.accessToken}`)
        .send({ blockedId: a.id });

      const sendRes = await request(app.getHttpServer())
        .post(`/conversations/${matchId}/messages`)
        .set("Authorization", `Bearer ${a.accessToken}`)
        .send({ kind: "TEXT", body: "still there?" });
      expect(sendRes.status).toBe(403);
    });
  });
});
