import { describe, it, expect, vi, afterEach } from "vitest";

const ORIGINAL_ENV = { ...process.env };

function setEnv() {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.supabase.test";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
}

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.restoreAllMocks();
});

describe("signUp / signInWithPassword", () => {
  it("returns not-configured (503) without calling fetch when credentials are missing", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    global.fetch = vi.fn();
    const { signUp } = await import("./auth.js");

    const result = await signUp("a@example.com", "password123");

    expect(result.ok).toBe(false);
    expect(result.status).toBe(503);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("posts to /auth/v1/signup with the service key as apikey", async () => {
    setEnv();
    const calls = [];
    global.fetch = vi.fn(async (url, opts) => {
      calls.push({ url: String(url), opts });
      return { ok: true, json: async () => ({ user: { id: "u1", email: "a@example.com" }, session: null }) };
    });
    const { signUp } = await import("./auth.js");

    const result = await signUp("a@example.com", "password123");

    expect(result.ok).toBe(true);
    expect(calls[0].url).toBe("https://project.supabase.test/auth/v1/signup");
    expect(calls[0].opts.headers.apikey).toBe("service-role-key");
    expect(JSON.parse(calls[0].opts.body)).toEqual({ email: "a@example.com", password: "password123" });
  });

  it("posts to the password grant endpoint for sign-in", async () => {
    setEnv();
    const calls = [];
    global.fetch = vi.fn(async (url, opts) => {
      calls.push({ url: String(url), opts });
      return { ok: true, json: async () => ({ access_token: "tok", refresh_token: "rtok", expires_in: 3600, user: { id: "u1", email: "a@example.com" } }) };
    });
    const { signInWithPassword } = await import("./auth.js");

    const result = await signInWithPassword("a@example.com", "password123");

    expect(result.ok).toBe(true);
    expect(calls[0].url).toBe("https://project.supabase.test/auth/v1/token?grant_type=password");
    expect(result.data.access_token).toBe("tok");
  });

  it("surfaces a non-ok response instead of throwing", async () => {
    setEnv();
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 400, json: async () => ({ msg: "User already registered" }) });
    const { signUp } = await import("./auth.js");

    const result = await signUp("a@example.com", "password123");

    expect(result.ok).toBe(false);
    expect(result.status).toBe(400);
    expect(result.data.msg).toBe("User already registered");
  });
});

describe("getUser", () => {
  it("fails without calling fetch when no access token is given", async () => {
    setEnv();
    global.fetch = vi.fn();
    const { getUser } = await import("./auth.js");

    const result = await getUser(null);

    expect(result.ok).toBe(false);
    expect(result.status).toBe(401);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("sends the caller's own access token as the Authorization bearer, not the service key", async () => {
    setEnv();
    const calls = [];
    global.fetch = vi.fn(async (url, opts) => {
      calls.push({ url: String(url), opts });
      return { ok: true, json: async () => ({ id: "u1", email: "a@example.com" }) };
    });
    const { getUser } = await import("./auth.js");

    const result = await getUser("user-access-token");

    expect(result.ok).toBe(true);
    expect(calls[0].url).toBe("https://project.supabase.test/auth/v1/user");
    expect(calls[0].opts.headers.Authorization).toBe("Bearer user-access-token");
    expect(calls[0].opts.headers.apikey).toBe("service-role-key");
  });
});

describe("bearerToken", () => {
  it("extracts the token from a Bearer authorization header", async () => {
    const { bearerToken } = await import("./auth.js");
    expect(bearerToken({ headers: { get: (k) => (k === "authorization" ? "Bearer abc123" : null) } })).toBe("abc123");
  });

  it("returns null when there is no authorization header", async () => {
    const { bearerToken } = await import("./auth.js");
    expect(bearerToken({ headers: { get: () => null } })).toBeNull();
  });
});
