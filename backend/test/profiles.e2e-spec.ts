import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { configureApp } from "../src/configure-app";
import { PrismaService } from "../src/prisma/prisma.service";
import { resetDatabase } from "./db-test-utils";
import { registerUser } from "./test-helpers";

// Profiles had zero e2e coverage before this pass — see TEST_COVERAGE_REPORT.md. This
// covers the core profile lifecycle plus the specific hardening fixes made in this audit
// (ParseUUIDPipe on :photoId/:userId, @IsNotEmpty on displayName/storageKey).
describe("Profiles (e2e)", () => {
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

  describe("PUT /profiles/me", () => {
    it("creates a profile and GET /profiles/me returns it", async () => {
      const user = await registerUser(app);

      const putRes = await request(app.getHttpServer())
        .put("/profiles/me")
        .set("Authorization", `Bearer ${user.accessToken}`)
        .send({ displayName: "Riley", city: "Testville" });
      expect(putRes.status).toBe(200);
      expect(putRes.body.displayName).toBe("Riley");

      const getRes = await request(app.getHttpServer())
        .get("/profiles/me")
        .set("Authorization", `Bearer ${user.accessToken}`);
      expect(getRes.status).toBe(200);
      expect(getRes.body.displayName).toBe("Riley");
    });

    it("rejects an empty displayName", async () => {
      const user = await registerUser(app);
      const res = await request(app.getHttpServer())
        .put("/profiles/me")
        .set("Authorization", `Bearer ${user.accessToken}`)
        .send({ displayName: "" });
      expect(res.status).toBe(400);
    });

    it("rejects a missing displayName", async () => {
      const user = await registerUser(app);
      const res = await request(app.getHttpServer())
        .put("/profiles/me")
        .set("Authorization", `Bearer ${user.accessToken}`)
        .send({ city: "Testville" });
      expect(res.status).toBe(400);
    });
  });

  describe("PUT /profiles/me/preferences", () => {
    it("rejects ageMin greater than ageMax", async () => {
      const user = await registerUser(app);
      const res = await request(app.getHttpServer())
        .put("/profiles/me/preferences")
        .set("Authorization", `Bearer ${user.accessToken}`)
        .send({ ageMin: 40, ageMax: 25 });
      expect(res.status).toBe(400);
    });

    it("accepts valid preferences", async () => {
      const user = await registerUser(app);
      const res = await request(app.getHttpServer())
        .put("/profiles/me/preferences")
        .set("Authorization", `Bearer ${user.accessToken}`)
        .send({ ageMin: 21, ageMax: 40, seekingGenders: ["woman", "man"] });
      expect(res.status).toBe(200);
      expect(res.body.ageMin).toBe(21);
    });
  });

  describe("Photos", () => {
    it("rejects an empty storageKey", async () => {
      const user = await registerUser(app);
      await request(app.getHttpServer())
        .put("/profiles/me")
        .set("Authorization", `Bearer ${user.accessToken}`)
        .send({ displayName: "Riley" });

      const res = await request(app.getHttpServer())
        .post("/profiles/me/photos")
        .set("Authorization", `Bearer ${user.accessToken}`)
        .send({ storageKey: "" });
      expect(res.status).toBe(400);
    });

    it("rejects a malformed (non-UUID) photoId with 400, not a raw Prisma error", async () => {
      const user = await registerUser(app);
      const res = await request(app.getHttpServer())
        .delete("/profiles/me/photos/not-a-uuid")
        .set("Authorization", `Bearer ${user.accessToken}`);
      expect(res.status).toBe(400);
    });
  });

  describe("GET /profiles/:userId", () => {
    it("rejects a malformed (non-UUID) userId with 400", async () => {
      const user = await registerUser(app);
      const res = await request(app.getHttpServer())
        .get("/profiles/not-a-uuid")
        .set("Authorization", `Bearer ${user.accessToken}`);
      expect(res.status).toBe(400);
    });

    it("returns 404 for a well-formed but nonexistent userId", async () => {
      const user = await registerUser(app);
      const res = await request(app.getHttpServer())
        .get("/profiles/00000000-0000-0000-0000-000000000000")
        .set("Authorization", `Bearer ${user.accessToken}`);
      expect(res.status).toBe(404);
    });
  });
});
