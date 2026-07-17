import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { configureApp } from "../src/configure-app";

describe("Health endpoints (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /live requires no auth and no dependencies", async () => {
    const res = await request(app.getHttpServer()).get("/live");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  it("GET /ready reports the real Postgres (and, if configured, Redis) connection as up", async () => {
    const res = await request(app.getHttpServer()).get("/ready");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.details.database.status).toBe("up");
  });

  it("GET /health includes memory indicators alongside the dependency checks", async () => {
    const res = await request(app.getHttpServer()).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.details.database.status).toBe("up");
    expect(res.body.details.memory_heap.status).toBe("up");
    expect(res.body.details.memory_rss.status).toBe("up");
  });

  it("none of the health routes require a bearer token", async () => {
    for (const route of ["/live", "/ready", "/health"]) {
      const res = await request(app.getHttpServer()).get(route);
      expect(res.status).not.toBe(401);
    }
  });
});
