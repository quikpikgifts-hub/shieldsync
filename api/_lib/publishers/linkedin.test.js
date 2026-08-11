import { describe, it, expect, vi, afterEach } from "vitest";
import { CONNECTION_STATES } from "./states.js";

const ORIGINAL_ENV = { ...process.env };
const KV_URL = "https://kv.example.test";

function setEnv() {
  process.env.KV_REST_API_URL = KV_URL;
  process.env.KV_REST_API_TOKEN = "kv-token";
  process.env.LINKEDIN_CLIENT_ID = "client-id";
  process.env.LINKEDIN_CLIENT_SECRET = "client-secret";
  process.env.LINKEDIN_REDIRECT_URI = "https://example.test/api/social/oauth/linkedin/callback";
}

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.restoreAllMocks();
});

describe("buildAuthorizeUrl", () => {
  it("includes client_id, redirect_uri, state, and scopes", async () => {
    setEnv();
    const { buildAuthorizeUrl } = await import("./linkedin.js");
    const url = buildAuthorizeUrl("abc123");
    expect(url).toContain("client_id=client-id");
    expect(url).toContain("state=abc123");
    expect(url).toContain(encodeURIComponent("https://example.test/api/social/oauth/linkedin/callback"));
    expect(url).toContain("w_member_social");
  });
});

describe("getConnectionState", () => {
  it("is waiting_for_credentials when env vars are missing", async () => {
    delete process.env.LINKEDIN_CLIENT_ID;
    const { getConnectionState } = await import("./linkedin.js");
    const result = await getConnectionState();
    expect(result.state).toBe(CONNECTION_STATES.WAITING_FOR_CREDENTIALS);
  });

  it("is ready_to_activate when configured but no account token stored", async () => {
    setEnv();
    global.fetch = vi.fn().mockResolvedValue({ json: async () => ({ result: null }) });
    const { getConnectionState } = await import("./linkedin.js");
    const result = await getConnectionState();
    expect(result.state).toBe(CONNECTION_STATES.READY_TO_ACTIVATE);
  });

  it("is connected when a valid, non-expired token is stored", async () => {
    setEnv();
    const stored = { access_token: "tok", refresh_token: null, expires_at: Date.now() + 3600_000 };
    global.fetch = vi.fn().mockResolvedValue({ json: async () => ({ result: JSON.stringify(stored) }) });
    const { getConnectionState } = await import("./linkedin.js");
    const result = await getConnectionState();
    expect(result.state).toBe(CONNECTION_STATES.CONNECTED);
  });
});

describe("publish", () => {
  it("returns not_configured when env vars are missing", async () => {
    delete process.env.LINKEDIN_CLIENT_ID;
    const { publish } = await import("./linkedin.js");
    const result = await publish({ caption: "hi" });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("not_configured");
  });

  it("requires a non-empty caption even when configured", async () => {
    setEnv();
    const { publish } = await import("./linkedin.js");
    const result = await publish({ caption: "" });
    expect(result.reason).toBe("caption_required");
  });

  it("returns account_not_connected when no token is stored", async () => {
    setEnv();
    global.fetch = vi.fn().mockResolvedValue({ json: async () => ({ result: null }) });
    const { publish } = await import("./linkedin.js");
    const result = await publish({ caption: "hi" });
    expect(result.reason).toBe("account_not_connected");
  });

  it("returns account_not_connected when a token exists but no author_urn was ever learned", async () => {
    setEnv();
    const stored = { access_token: "tok", expires_at: Date.now() + 3600_000, author_urn: null };
    global.fetch = vi.fn().mockResolvedValue({ json: async () => ({ result: JSON.stringify(stored) }) });
    const { publish } = await import("./linkedin.js");
    const result = await publish({ caption: "hi" });
    expect(result.reason).toBe("account_not_connected");
  });

  it("posts to /rest/posts with the author URN, LinkedIn-Version header, and reads the id from x-restli-id", async () => {
    setEnv();
    const stored = { access_token: "tok", expires_at: Date.now() + 3600_000, author_urn: "urn:li:person:abc" };
    const calls = [];
    global.fetch = vi.fn(async (url, opts) => {
      calls.push({ url: String(url), opts });
      if (String(url) === KV_URL) return { json: async () => ({ result: JSON.stringify(stored) }) };
      if (String(url) === "https://api.linkedin.com/rest/posts") {
        return { ok: true, headers: { get: (h) => (h === "x-restli-id" ? "urn:li:share:999" : null) } };
      }
      throw new Error(`unexpected fetch ${url}`);
    });

    const { publish } = await import("./linkedin.js");
    const result = await publish({ caption: "hello world" });

    expect(result.ok).toBe(true);
    expect(result.postId).toBe("urn:li:share:999");
    const postCall = calls.find((c) => c.url === "https://api.linkedin.com/rest/posts");
    expect(postCall.opts.headers["LinkedIn-Version"]).toBe("202401");
    expect(postCall.opts.headers.Authorization).toBe("Bearer tok");
    expect(JSON.parse(postCall.opts.body).author).toBe("urn:li:person:abc");
  });

  it("does not attempt to refresh without a refresh_token", async () => {
    setEnv();
    const expired = { access_token: "old", refresh_token: null, expires_at: Date.now() - 1000, author_urn: "urn:li:person:abc" };
    global.fetch = vi.fn().mockResolvedValue({ json: async () => ({ result: JSON.stringify(expired) }) });
    const { publish } = await import("./linkedin.js");
    const result = await publish({ caption: "hi" });
    expect(result.reason).toBe("account_not_connected");
  });
});

describe("verifyConnection", () => {
  it("calls /v2/userinfo and records the author URN + display name on success", async () => {
    setEnv();
    const stored = { access_token: "tok", expires_at: Date.now() + 3600_000 };
    const calls = [];
    global.fetch = vi.fn(async (url, opts) => {
      calls.push({ url: String(url), opts });
      if (String(url) === KV_URL) return { json: async () => ({ result: JSON.stringify(stored) }) };
      if (String(url) === "https://api.linkedin.com/v2/userinfo") {
        return { ok: true, json: async () => ({ sub: "abc123", name: "Jamie Founder" }) };
      }
      throw new Error(`unexpected fetch ${url}`);
    });

    const { verifyConnection } = await import("./linkedin.js");
    const result = await verifyConnection();

    expect(result.ok).toBe(true);
    expect(result.displayName).toBe("Jamie Founder");
    const setCall = calls.find((c) => c.url === KV_URL && JSON.parse(c.opts.body)[0] === "SET");
    const saved = JSON.parse(JSON.parse(setCall.opts.body)[2]);
    expect(saved.author_urn).toBe("urn:li:person:abc123");
  });

  it("reports verification_failed when LinkedIn's API rejects the token", async () => {
    setEnv();
    const stored = { access_token: "tok", expires_at: Date.now() + 3600_000 };
    global.fetch = vi.fn(async (url) => {
      if (String(url) === KV_URL) return { json: async () => ({ result: JSON.stringify(stored) }) };
      if (String(url) === "https://api.linkedin.com/v2/userinfo") {
        return { ok: false, status: 401, json: async () => ({ message: "invalid token" }) };
      }
      throw new Error(`unexpected fetch ${url}`);
    });

    const { verifyConnection } = await import("./linkedin.js");
    const result = await verifyConnection();
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("verification_failed");
  });
});
