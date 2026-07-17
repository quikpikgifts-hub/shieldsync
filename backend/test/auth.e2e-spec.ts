import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { configureApp } from "../src/configure-app";
import { PrismaService } from "../src/prisma/prisma.service";
import { resetDatabase } from "./db-test-utils";

describe("Auth (e2e)", () => {
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

  const validRegisterBody = {
    email: "riley@example.com",
    password: "correcthorse123",
    dateOfBirth: "1995-05-01",
  };

  describe("POST /auth/register", () => {
    it("creates an account and returns a token pair", async () => {
      const res = await request(app.getHttpServer()).post("/auth/register").send(validRegisterBody);

      expect(res.status).toBe(201);
      expect(res.body.user.email).toBe(validRegisterBody.email);
      expect(res.body.user.roles).toEqual(["user"]);
      expect(typeof res.body.tokens.accessToken).toBe("string");
      expect(typeof res.body.tokens.refreshToken).toBe("string");
    });

    it("never returns a password hash in the response", async () => {
      const res = await request(app.getHttpServer()).post("/auth/register").send(validRegisterBody);
      expect(JSON.stringify(res.body)).not.toContain("passwordHash");
    });

    it("rejects a duplicate email with 409", async () => {
      await request(app.getHttpServer()).post("/auth/register").send(validRegisterBody);
      const res = await request(app.getHttpServer()).post("/auth/register").send(validRegisterBody);
      expect(res.status).toBe(409);
    });

    it("rejects registration under the minimum age", async () => {
      const res = await request(app.getHttpServer())
        .post("/auth/register")
        .send({ ...validRegisterBody, email: "kid@example.com", dateOfBirth: "2015-01-01" });
      expect(res.status).toBe(400);
    });

    it("rejects a weak password", async () => {
      const res = await request(app.getHttpServer())
        .post("/auth/register")
        .send({ ...validRegisterBody, email: "weak@example.com", password: "short" });
      expect(res.status).toBe(400);
    });

    it("rejects unknown fields on the DTO (whitelist enforcement)", async () => {
      const res = await request(app.getHttpServer())
        .post("/auth/register")
        .send({ ...validRegisterBody, email: "extra@example.com", isAdmin: true });
      expect(res.status).toBe(400);
    });
  });

  describe("POST /auth/login", () => {
    beforeEach(async () => {
      await request(app.getHttpServer()).post("/auth/register").send(validRegisterBody);
    });

    it("logs in with correct credentials", async () => {
      const res = await request(app.getHttpServer())
        .post("/auth/login")
        .send({ email: validRegisterBody.email, password: validRegisterBody.password });
      expect(res.status).toBe(200);
      expect(typeof res.body.tokens.accessToken).toBe("string");
    });

    it("rejects the wrong password with a generic message", async () => {
      const res = await request(app.getHttpServer())
        .post("/auth/login")
        .send({ email: validRegisterBody.email, password: "wrongpassword" });
      expect(res.status).toBe(401);
      expect(res.body.message).toBe("Invalid email or password.");
    });

    it("returns the same generic message for a nonexistent account (anti-enumeration)", async () => {
      const res = await request(app.getHttpServer())
        .post("/auth/login")
        .send({ email: "nobody@example.com", password: "whatever123" });
      expect(res.status).toBe(401);
      expect(res.body.message).toBe("Invalid email or password.");
    });
  });

  describe("POST /auth/refresh", () => {
    it("rotates the refresh token and rejects reuse of the old one", async () => {
      const registerRes = await request(app.getHttpServer()).post("/auth/register").send(validRegisterBody);
      const originalRefreshToken = registerRes.body.tokens.refreshToken;

      const refreshRes = await request(app.getHttpServer())
        .post("/auth/refresh")
        .send({ refreshToken: originalRefreshToken });
      expect(refreshRes.status).toBe(200);
      expect(refreshRes.body.refreshToken).not.toBe(originalRefreshToken);

      const reuseRes = await request(app.getHttpServer())
        .post("/auth/refresh")
        .send({ refreshToken: originalRefreshToken });
      expect(reuseRes.status).toBe(401);
    });

    it("rejects a garbage refresh token", async () => {
      const res = await request(app.getHttpServer())
        .post("/auth/refresh")
        .send({ refreshToken: "not-a-real-token" });
      expect(res.status).toBe(401);
    });
  });

  describe("Protected routes", () => {
    it("rejects requests with no token", async () => {
      const res = await request(app.getHttpServer()).get("/users/me");
      expect(res.status).toBe(401);
    });

    it("rejects requests with a garbage token", async () => {
      const res = await request(app.getHttpServer()).get("/users/me").set("Authorization", "Bearer garbage");
      expect(res.status).toBe(401);
    });

    it("accepts a valid access token and returns the caller's own record", async () => {
      const registerRes = await request(app.getHttpServer()).post("/auth/register").send(validRegisterBody);
      const { accessToken } = registerRes.body.tokens;

      const res = await request(app.getHttpServer()).get("/users/me").set("Authorization", `Bearer ${accessToken}`);
      expect(res.status).toBe(200);
      expect(res.body.email).toBe(validRegisterBody.email);
    });
  });
});
