import { describe, it, expect, vi, afterEach } from "vitest";
import { CONNECTION_STATES } from "./states.js";

const ORIGINAL_ENV = { ...process.env };
const KV_URL = "https://kv.example.test";

function setEnv() {
  process.env.KV_REST_API_URL = KV_URL;
  process.env.KV_REST_API_TOKEN = "kv-token";
  process.env.TIKTOK_CLIENT_KEY = "client-key";
  process.env.TIKTOK_CLIENT_SECRET = "client-secret";
  process.env.TIKTOK_REDIRECT_URI = "https://example.test/api/social/oauth/tiktok/callback";
}

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.restoreAllMocks();
});

describe("buildAuthorizeUrl", () => {
  it("includes client_key, redirect_uri, and state", async () => {
    setEnv();
    const { buildAuthorizeUrl } = await import("./tiktok.js");
    const url = buildAuthorizeUrl("abc123");
    expect(url).toContain("client_key=client-key");
    expect(url).toContain("state=abc123");
    expect(url).toContain(encodeURIComponent("https://example.test/api/social/oauth/tiktok/callback"));
    expect(url).toContain("video.publish");
  });
});

describe("getConnectionState", () => {
  it("is waiting_for_credentials when env vars are missing", async () => {
    delete process.env.TIKTOK_CLIENT_KEY;
    const { getConnectionState } = await import("./tiktok.js");
    const result = await getConnectionState();
    expect(result.state).toBe(CONNECTION_STATES.WAITING_FOR_CREDENTIALS);
  });

  it("is ready_to_activate when configured but no account token stored", async () => {
    setEnv();
    global.fetch = vi.fn().mockResolvedValue({ json: async () => ({ result: null }) }); // kv GET -> null
    const { getConnectionState } = await import("./tiktok.js");
    const result = await getConnectionState();
    expect(result.state).toBe(CONNECTION_STATES.READY_TO_ACTIVATE);
  });

  it("is connected when a valid, non-expired token is stored", async () => {
    setEnv();
    const stored = { access_token: "tok", refresh_token: "rtok", expires_at: Date.now() + 3600_000 };
    global.fetch = vi.fn().mockResolvedValue({ json: async () => ({ result: JSON.stringify(stored) }) });
    const { getConnectionState } = await import("./tiktok.js");
    const result = await getConnectionState();
    expect(result.state).toBe(CONNECTION_STATES.CONNECTED);
  });
});

describe("publish", () => {
  it("returns not_configured when env vars are missing", async () => {
    delete process.env.TIKTOK_CLIENT_KEY;
    const { publish } = await import("./tiktok.js");
    const result = await publish({ caption: "hi", mediaUrl: "https://example.test/v.mp4" });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("not_configured");
  });

  it("requires mediaUrl even when configured", async () => {
    setEnv();
    const { publish } = await import("./tiktok.js");
    const result = await publish({ caption: "hi" });
    expect(result.reason).toBe("media_required");
  });

  it("returns account_not_connected when no token is stored", async () => {
    setEnv();
    global.fetch = vi.fn().mockResolvedValue({ json: async () => ({ result: null }) });
    const { publish } = await import("./tiktok.js");
    const result = await publish({ caption: "hi", mediaUrl: "https://example.test/v.mp4" });
    expect(result.reason).toBe("account_not_connected");
  });

  it("calls the publish/init endpoint with a valid stored token and defaults to SELF_ONLY privacy", async () => {
    setEnv();
    const stored = { access_token: "tok", refresh_token: "rtok", expires_at: Date.now() + 3600_000 };
    const calls = [];
    global.fetch = vi.fn(async (url, opts) => {
      calls.push({ url: String(url), opts });
      if (String(url) === KV_URL) return { json: async () => ({ result: JSON.stringify(stored) }) };
      if (String(url).includes("/post/publish/video/init/")) {
        return { ok: true, json: async () => ({ data: { publish_id: "pub_123" } }) };
      }
      throw new Error(`unexpected fetch ${url}`);
    });

    const { publish } = await import("./tiktok.js");
    const result = await publish({ caption: "hello world", mediaUrl: "https://example.test/v.mp4" });

    expect(result.ok).toBe(true);
    expect(result.publishId).toBe("pub_123");
    expect(result.privacyLevel).toBe("SELF_ONLY");

    const initCall = calls.find((c) => c.url.includes("/post/publish/video/init/"));
    expect(initCall.opts.headers.Authorization).toBe("Bearer tok");
    const body = JSON.parse(initCall.opts.body);
    expect(body.post_info.privacy_level).toBe("SELF_ONLY");
    expect(body.source_info).toEqual({ source: "PULL_FROM_URL", video_url: "https://example.test/v.mp4" });
  });

  it("refreshes an expired token before publishing", async () => {
    setEnv();
    const expired = { access_token: "old", refresh_token: "rtok", expires_at: Date.now() - 1000 };
    const refreshed = { access_token: "new", refresh_token: "rtok2", expires_in: 3600 };
    const calls = [];
    global.fetch = vi.fn(async (url, opts) => {
      calls.push({ url: String(url), opts });
      if (String(url) === KV_URL) {
        const [cmd] = JSON.parse(opts.body);
        if (cmd === "GET") return { json: async () => ({ result: JSON.stringify(expired) }) };
        return { json: async () => ({ result: "OK" }) }; // SET after refresh
      }
      if (String(url).includes("/oauth/token/")) {
        return { ok: true, json: async () => (refreshed) };
      }
      if (String(url).includes("/post/publish/video/init/")) {
        return { ok: true, json: async () => ({ data: { publish_id: "pub_456" } }) };
      }
      throw new Error(`unexpected fetch ${url}`);
    });

    const { publish } = await import("./tiktok.js");
    const result = await publish({ caption: "hi", mediaUrl: "https://example.test/v.mp4" });

    expect(result.ok).toBe(true);
    const initCall = calls.find((c) => c.url.includes("/post/publish/video/init/"));
    expect(initCall.opts.headers.Authorization).toBe("Bearer new");
  });
});
