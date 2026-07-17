import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { configureApp } from "../src/configure-app";

describe("Observability (e2e)", () => {
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

  it("GET /metrics requires no auth and returns Prometheus-format text", async () => {
    const res = await request(app.getHttpServer()).get("/metrics");
    expect(res.status).toBe(200);
    expect(res.text).toContain("http_requests_total");
    expect(res.text).toContain("process_cpu_user_seconds_total");
  });

  it("records the matched route pattern, not the raw URL with real IDs in it", async () => {
    await request(app.getHttpServer()).get("/profiles/00000000-0000-0000-0000-000000000000");
    const res = await request(app.getHttpServer()).get("/metrics");
    expect(res.text).toContain('route="/profiles/:userId"');
    expect(res.text).not.toContain("00000000-0000-0000-0000-000000000000");
  });

  it("echoes a correlation ID back via the X-Request-Id response header", async () => {
    const res = await request(app.getHttpServer()).get("/live");
    expect(res.headers["x-request-id"]).toEqual(expect.any(String));
  });

  it("propagates a caller-supplied X-Request-Id instead of generating a new one", async () => {
    const res = await request(app.getHttpServer()).get("/live").set("X-Request-Id", "test-fixed-id-123");
    expect(res.headers["x-request-id"]).toBe("test-fixed-id-123");
  });
});
