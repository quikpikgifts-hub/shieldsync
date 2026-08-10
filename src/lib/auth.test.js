import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

function installFakeLocalStorage() {
  let data = {};
  global.localStorage = {
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => { data[k] = String(v); },
    removeItem: (k) => { delete data[k]; },
    clear: () => { data = {}; },
  };
}

installFakeLocalStorage();

function jsonResponse(body, ok = true, status = 200) {
  return { ok, status, json: async () => body };
}

beforeEach(() => {
  global.localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("signUp", () => {
  it("persists a session immediately when the server returns one", async () => {
    global.fetch = vi.fn().mockResolvedValue(jsonResponse({
      user: { id: "u1", email: "a@example.com" },
      session: { access_token: "tok", refresh_token: "rtok", expires_in: 3600 },
    }));
    const { signUp } = await import("./auth.js");

    const session = await signUp("a@example.com", "password123");

    expect(session.access_token).toBe("tok");
    expect(session.user.email).toBe("a@example.com");
    expect(JSON.parse(global.localStorage.getItem("va_auth_session")).access_token).toBe("tok");
  });

  it("reports needsEmailConfirmation without writing a session when none is returned", async () => {
    global.fetch = vi.fn().mockResolvedValue(jsonResponse({ user: { id: "u1", email: "a@example.com" }, session: null }));
    const { signUp } = await import("./auth.js");

    const result = await signUp("a@example.com", "password123");

    expect(result.needsEmailConfirmation).toBe(true);
    expect(global.localStorage.getItem("va_auth_session")).toBeNull();
  });

  it("throws the server's error message on failure", async () => {
    global.fetch = vi.fn().mockResolvedValue(jsonResponse({ error: "User already registered" }, false, 400));
    const { signUp } = await import("./auth.js");

    await expect(signUp("a@example.com", "password123")).rejects.toThrow("User already registered");
  });
});

describe("signInWithPassword", () => {
  it("persists the returned session", async () => {
    global.fetch = vi.fn().mockResolvedValue(jsonResponse({
      user: { id: "u1", email: "a@example.com" },
      session: { access_token: "tok", refresh_token: "rtok", expires_in: 3600 },
    }));
    const { signInWithPassword } = await import("./auth.js");

    const session = await signInWithPassword("a@example.com", "password123");

    expect(session.access_token).toBe("tok");
    expect(session.expires_at).toBeGreaterThan(Date.now());
  });
});

describe("getValidSession", () => {
  it("returns null when there is no stored session", async () => {
    const { getValidSession } = await import("./auth.js");
    expect(await getValidSession()).toBeNull();
  });

  it("returns the stored session without a network call when it isn't near expiry", async () => {
    global.localStorage.setItem("va_auth_session", JSON.stringify({
      access_token: "tok", refresh_token: "rtok", expires_at: Date.now() + 3600_000, user: { id: "u1", email: "a@example.com" },
    }));
    global.fetch = vi.fn();
    const { getValidSession } = await import("./auth.js");

    const session = await getValidSession();

    expect(session.access_token).toBe("tok");
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("silently refreshes when the access token is expired", async () => {
    global.localStorage.setItem("va_auth_session", JSON.stringify({
      access_token: "old", refresh_token: "rtok", expires_at: Date.now() - 1000, user: { id: "u1", email: "a@example.com" },
    }));
    global.fetch = vi.fn().mockResolvedValue(jsonResponse({
      user: { id: "u1", email: "a@example.com" },
      session: { access_token: "new", refresh_token: "rtok2", expires_in: 3600 },
    }));
    const { getValidSession } = await import("./auth.js");

    const session = await getValidSession();

    expect(session.access_token).toBe("new");
    expect(JSON.parse(global.localStorage.getItem("va_auth_session")).access_token).toBe("new");
  });

  it("clears the session and returns null when the refresh token is no longer valid", async () => {
    global.localStorage.setItem("va_auth_session", JSON.stringify({
      access_token: "old", refresh_token: "bad", expires_at: Date.now() - 1000, user: { id: "u1", email: "a@example.com" },
    }));
    global.fetch = vi.fn().mockResolvedValue(jsonResponse({ error: "invalid refresh token" }, false, 401));
    const { getValidSession } = await import("./auth.js");

    const session = await getValidSession();

    expect(session).toBeNull();
    expect(global.localStorage.getItem("va_auth_session")).toBeNull();
  });
});

describe("signOut", () => {
  it("calls the signout endpoint with the bearer token and clears the local session", async () => {
    global.localStorage.setItem("va_auth_session", JSON.stringify({
      access_token: "tok", refresh_token: "rtok", expires_at: Date.now() + 3600_000, user: { id: "u1", email: "a@example.com" },
    }));
    const calls = [];
    global.fetch = vi.fn(async (url, opts) => { calls.push({ url: String(url), opts }); return jsonResponse({ ok: true }); });
    const { signOut } = await import("./auth.js");

    await signOut();

    expect(calls[0].url).toBe("/api/auth/signout");
    expect(calls[0].opts.headers.Authorization).toBe("Bearer tok");
    expect(global.localStorage.getItem("va_auth_session")).toBeNull();
  });

  it("still clears the local session even if the network call fails", async () => {
    global.localStorage.setItem("va_auth_session", JSON.stringify({
      access_token: "tok", refresh_token: "rtok", expires_at: Date.now() + 3600_000, user: { id: "u1", email: "a@example.com" },
    }));
    global.fetch = vi.fn().mockRejectedValue(new Error("network down"));
    const { signOut } = await import("./auth.js");

    await signOut();

    expect(global.localStorage.getItem("va_auth_session")).toBeNull();
  });
});

describe("fetchOrganizations", () => {
  it("calls /api/auth/session with the bearer token", async () => {
    const calls = [];
    global.fetch = vi.fn(async (url, opts) => { calls.push({ url: String(url), opts }); return jsonResponse({ user: { id: "u1", email: "a@example.com" }, organizations: [{ id: "o1", name: "a's workspace", role: "owner" }] }); });
    const { fetchOrganizations } = await import("./auth.js");

    const result = await fetchOrganizations("tok");

    expect(calls[0].url).toBe("/api/auth/session");
    expect(calls[0].opts.headers.Authorization).toBe("Bearer tok");
    expect(result.organizations).toHaveLength(1);
  });
});
