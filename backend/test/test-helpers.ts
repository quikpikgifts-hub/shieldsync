import type { INestApplication } from "@nestjs/common";
import request from "supertest";

export interface RegisteredUser {
  id: string;
  email: string;
  accessToken: string;
  refreshToken: string;
}

let counter = 0;

export async function registerUser(
  app: INestApplication,
  overrides: Partial<{ email: string; password: string; dateOfBirth: string }> = {},
): Promise<RegisteredUser> {
  counter += 1;
  const body = {
    email: overrides.email ?? `user${counter}-${Date.now()}@example.com`,
    password: overrides.password ?? "correcthorse123",
    dateOfBirth: overrides.dateOfBirth ?? "1995-05-01",
  };

  const res = await request(app.getHttpServer()).post("/auth/register").send(body);
  if (res.status !== 201) {
    throw new Error(`registerUser helper failed: ${res.status} ${JSON.stringify(res.body)}`);
  }

  return {
    id: res.body.user.id,
    email: body.email,
    accessToken: res.body.tokens.accessToken,
    refreshToken: res.body.tokens.refreshToken,
  };
}

export async function createProfile(
  app: INestApplication,
  accessToken: string,
  overrides: Partial<{ displayName: string; intent: string; city: string }> = {},
): Promise<void> {
  const res = await request(app.getHttpServer())
    .put("/profiles/me")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({
      displayName: overrides.displayName ?? "Test User",
      intent: overrides.intent ?? "SERIOUS",
      city: overrides.city ?? "Testville",
    });
  if (res.status !== 200) {
    throw new Error(`createProfile helper failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
}
