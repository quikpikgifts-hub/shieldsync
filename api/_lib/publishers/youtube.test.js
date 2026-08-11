import { describe, it, expect, vi, afterEach } from "vitest";
import { CONNECTION_STATES } from "./states.js";

const ORIGINAL_ENV = { ...process.env };
const KV_URL = "https://kv.example.test";

function setEnv() {
  process.env.KV_REST_API_URL = KV_URL;
  process.env.KV_REST_API_TOKEN = "kv-token";
  process.env.GOOGLE_CLIENT_ID = "client-id";
  process.env.GOOGLE_CLIENT_SECRET = "client-secret";
  process.env.GOOGLE_REDIRECT_URI = "https://example.test/api/social/oauth/youtube/callback";
}

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.restoreAllMocks();
});

describe("buildAuthorizeUrl", () => {
  it("requests offline access with forced consent so a refresh_token is issued", async () => {
    setEnv();
    const { buildAuthorizeUrl } = await import("./youtube.js");
    const url = buildAuthorizeUrl("abc123");
    expect(url).toContain("client_id=client-id");
    expect(url).toContain("state=abc123");
    expect(url).toContain("access_type=offline");
    expect(url).toContain("prompt=consent");
    expect(url).toContain(encodeURIComponent("https://example.test/api/social/oauth/youtube/callback"));
  });
});

describe("getConnectionState", () => {
  it("is waiting_for_credentials when env vars are missing", async () => {
    delete process.env.GOOGLE_CLIENT_ID;
    const { getConnectionState } = await import("./youtube.js");
    const result = await getConnectionState();
    expect(result.state).toBe(CONNECTION_STATES.WAITING_FOR_CREDENTIALS);
  });

  it("is ready_to_activate when configured but no account token stored", async () => {
    setEnv();
    global.fetch = vi.fn().mockResolvedValue({ json: async () => ({ result: null }) });
    const { getConnectionState } = await import("./youtube.js");
    const result = await getConnectionState();
    expect(result.state).toBe(CONNECTION_STATES.READY_TO_ACTIVATE);
  });

  it("is connected when a valid, non-expired token is stored", async () => {
    setEnv();
    const stored = { access_token: "tok", refresh_token: "rtok", expires_at: Date.now() + 3600_000 };
    global.fetch = vi.fn().mockResolvedValue({ json: async () => ({ result: JSON.stringify(stored) }) });
    const { getConnectionState } = await import("./youtube.js");
    const result = await getConnectionState();
    expect(result.state).toBe(CONNECTION_STATES.CONNECTED);
  });
});

describe("publish", () => {
  it("returns not_configured when env vars are missing", async () => {
    delete process.env.GOOGLE_CLIENT_ID;
    const { publish } = await import("./youtube.js");
    const result = await publish({ caption: "hi", mediaUrl: "https://example.test/v.mp4" });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("not_configured");
  });

  it("requires mediaUrl even when configured", async () => {
    setEnv();
    const { publish } = await import("./youtube.js");
    const result = await publish({ caption: "hi" });
    expect(result.reason).toBe("media_required");
  });

  it("returns account_not_connected when no token is stored", async () => {
    setEnv();
    global.fetch = vi.fn().mockResolvedValue({ json: async () => ({ result: null }) });
    const { publish } = await import("./youtube.js");
    const result = await publish({ caption: "hi", mediaUrl: "https://example.test/v.mp4" });
    expect(result.reason).toBe("account_not_connected");
  });

  it("HEADs the media for size/type, initiates a resumable session, then streams the PUT and defaults to private", async () => {
    setEnv();
    const stored = { access_token: "tok", refresh_token: "rtok", expires_at: Date.now() + 3600_000 };
    const calls = [];
    global.fetch = vi.fn(async (url, opts) => {
      calls.push({ url: String(url), opts });
      if (String(url) === KV_URL) return { json: async () => ({ result: JSON.stringify(stored) }) };
      if (opts?.method === "HEAD") {
        return { ok: true, headers: { get: (h) => (h === "content-length" ? "1048576" : h === "content-type" ? "video/mp4" : null) } };
      }
      if (String(url).startsWith("https://www.googleapis.com/upload/youtube/v3/videos")) {
        return { ok: true, headers: { get: (h) => (h === "location" ? "https://upload.example.test/session123" : null) } };
      }
      if (String(url) === "https://upload.example.test/session123") {
        return { ok: true, json: async () => ({ id: "video_123" }) };
      }
      // plain GET of the media itself, for streaming
      if (String(url) === "https://example.test/v.mp4") {
        return { ok: true, body: {} };
      }
      throw new Error(`unexpected fetch ${url}`);
    });

    const { publish } = await import("./youtube.js");
    const result = await publish({ caption: "hello", mediaUrl: "https://example.test/v.mp4" });

    expect(result.ok).toBe(true);
    expect(result.videoId).toBe("video_123");
    expect(result.privacyStatus).toBe("private");

    const initCall = calls.find((c) => c.url.startsWith("https://www.googleapis.com/upload/youtube/v3/videos"));
    expect(initCall.opts.headers["X-Upload-Content-Length"]).toBe("1048576");
    expect(initCall.opts.headers["X-Upload-Content-Type"]).toBe("video/mp4");
    expect(JSON.parse(initCall.opts.body).status.privacyStatus).toBe("private");

    const uploadCall = calls.find((c) => c.url === "https://upload.example.test/session123");
    expect(uploadCall.opts.method).toBe("PUT");
    expect(uploadCall.opts.headers["Content-Length"]).toBe("1048576");
  });

  it("respects YOUTUBE_PRIVACY_STATUS when set", async () => {
    setEnv();
    process.env.YOUTUBE_PRIVACY_STATUS = "public";
    const stored = { access_token: "tok", refresh_token: "rtok", expires_at: Date.now() + 3600_000 };
    global.fetch = vi.fn(async (url, opts) => {
      if (String(url) === KV_URL) return { json: async () => ({ result: JSON.stringify(stored) }) };
      if (opts?.method === "HEAD") return { ok: true, headers: { get: (h) => (h === "content-length" ? "100" : "video/mp4") } };
      if (String(url).startsWith("https://www.googleapis.com/upload/youtube/v3/videos")) {
        return { ok: true, headers: { get: () => "https://upload.example.test/session123" } };
      }
      if (String(url) === "https://upload.example.test/session123") return { ok: true, json: async () => ({ id: "v1" }) };
      return { ok: true, body: {} };
    });

    const { publish } = await import("./youtube.js");
    const result = await publish({ caption: "hi", mediaUrl: "https://example.test/v.mp4" });
    expect(result.privacyStatus).toBe("public");
  });

  it("fails cleanly when the media URL doesn't report a Content-Length", async () => {
    setEnv();
    const stored = { access_token: "tok", refresh_token: "rtok", expires_at: Date.now() + 3600_000 };
    global.fetch = vi.fn(async (url, opts) => {
      if (String(url) === KV_URL) return { json: async () => ({ result: JSON.stringify(stored) }) };
      if (opts?.method === "HEAD") return { ok: true, headers: { get: () => null } };
      throw new Error("should not reach the upload init");
    });

    const { publish } = await import("./youtube.js");
    const result = await publish({ caption: "hi", mediaUrl: "https://example.test/v.mp4" });
    expect(result.reason).toBe("media_fetch_failed");
  });
});

describe("verifyConnection", () => {
  it("calls /youtube/v3/channels and records the channel title", async () => {
    setEnv();
    const stored = { access_token: "tok", refresh_token: "rtok", expires_at: Date.now() + 3600_000 };
    const calls = [];
    global.fetch = vi.fn(async (url, opts) => {
      calls.push({ url: String(url), opts });
      if (String(url) === KV_URL) return { json: async () => ({ result: JSON.stringify(stored) }) };
      if (String(url).startsWith("https://www.googleapis.com/youtube/v3/channels")) {
        return { ok: true, json: async () => ({ items: [{ snippet: { title: "My Bakery Channel" } }] }) };
      }
      throw new Error(`unexpected fetch ${url}`);
    });

    const { verifyConnection } = await import("./youtube.js");
    const result = await verifyConnection();

    expect(result.ok).toBe(true);
    expect(result.displayName).toBe("My Bakery Channel");
  });

  it("reports verification_failed when no channel is returned", async () => {
    setEnv();
    const stored = { access_token: "tok", refresh_token: "rtok", expires_at: Date.now() + 3600_000 };
    global.fetch = vi.fn(async (url) => {
      if (String(url) === KV_URL) return { json: async () => ({ result: JSON.stringify(stored) }) };
      return { ok: true, json: async () => ({ items: [] }) };
    });

    const { verifyConnection } = await import("./youtube.js");
    const result = await verifyConnection();
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("verification_failed");
  });
});
