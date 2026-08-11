import { describe, it, expect, vi, afterEach } from "vitest";
import { CONNECTION_STATES } from "./states.js";

const ORIGINAL_ENV = { ...process.env };
const KV_URL = "https://kv.example.test";

function setEnv() {
  process.env.KV_REST_API_URL = KV_URL;
  process.env.KV_REST_API_TOKEN = "kv-token";
  process.env.PINTEREST_CLIENT_ID = "client-id";
  process.env.PINTEREST_CLIENT_SECRET = "client-secret";
  process.env.PINTEREST_REDIRECT_URI = "https://example.test/api/social/oauth/pinterest/callback";
}

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.restoreAllMocks();
});

describe("buildAuthorizeUrl", () => {
  it("includes client_id, redirect_uri, state, and comma-joined scopes", async () => {
    setEnv();
    const { buildAuthorizeUrl } = await import("./pinterest.js");
    const url = buildAuthorizeUrl("abc123");
    expect(url).toContain("client_id=client-id");
    expect(url).toContain("state=abc123");
    expect(url).toContain(encodeURIComponent("boards:read,pins:read,pins:write"));
  });
});

describe("exchangeCodeForToken", () => {
  it("sends Basic auth built from client_id:client_secret", async () => {
    setEnv();
    const calls = [];
    global.fetch = vi.fn(async (url, opts) => {
      calls.push({ url: String(url), opts });
      return { ok: true, json: async () => ({ access_token: "tok", refresh_token: "rtok", expires_in: 3600 }) };
    });
    const { exchangeCodeForToken } = await import("./pinterest.js");

    await exchangeCodeForToken("auth-code");

    expect(calls[0].opts.headers.Authorization).toBe(`Basic ${btoa("client-id:client-secret")}`);
  });
});

describe("getConnectionState", () => {
  it("is waiting_for_credentials when env vars are missing", async () => {
    delete process.env.PINTEREST_CLIENT_ID;
    const { getConnectionState } = await import("./pinterest.js");
    const result = await getConnectionState();
    expect(result.state).toBe(CONNECTION_STATES.WAITING_FOR_CREDENTIALS);
  });

  it("is ready_to_activate when configured but no account token stored", async () => {
    setEnv();
    global.fetch = vi.fn().mockResolvedValue({ json: async () => ({ result: null }) });
    const { getConnectionState } = await import("./pinterest.js");
    const result = await getConnectionState();
    expect(result.state).toBe(CONNECTION_STATES.READY_TO_ACTIVATE);
  });

  it("is connected when a valid, non-expired token is stored", async () => {
    setEnv();
    const stored = { access_token: "tok", refresh_token: "rtok", expires_at: Date.now() + 3600_000 };
    global.fetch = vi.fn().mockResolvedValue({ json: async () => ({ result: JSON.stringify(stored) }) });
    const { getConnectionState } = await import("./pinterest.js");
    const result = await getConnectionState();
    expect(result.state).toBe(CONNECTION_STATES.CONNECTED);
  });
});

describe("publish", () => {
  it("returns not_configured when env vars are missing", async () => {
    delete process.env.PINTEREST_CLIENT_ID;
    const { publish } = await import("./pinterest.js");
    const result = await publish({ caption: "hi", mediaUrl: "https://example.test/img.jpg" });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("not_configured");
  });

  it("requires mediaUrl even when configured", async () => {
    setEnv();
    const { publish } = await import("./pinterest.js");
    const result = await publish({ caption: "hi" });
    expect(result.reason).toBe("media_required");
  });

  it("returns account_not_connected when no token is stored", async () => {
    setEnv();
    global.fetch = vi.fn().mockResolvedValue({ json: async () => ({ result: null }) });
    const { publish } = await import("./pinterest.js");
    const result = await publish({ caption: "hi", mediaUrl: "https://example.test/img.jpg" });
    expect(result.reason).toBe("account_not_connected");
  });

  it("returns board_required when connected but no board was ever learned", async () => {
    setEnv();
    const stored = { access_token: "tok", refresh_token: "rtok", expires_at: Date.now() + 3600_000, board_id: null };
    global.fetch = vi.fn().mockResolvedValue({ json: async () => ({ result: JSON.stringify(stored) }) });
    const { publish } = await import("./pinterest.js");
    const result = await publish({ caption: "hi", mediaUrl: "https://example.test/img.jpg" });
    expect(result.reason).toBe("board_required");
  });

  it("posts to /v5/pins with the stored board_id", async () => {
    setEnv();
    const stored = { access_token: "tok", refresh_token: "rtok", expires_at: Date.now() + 3600_000, board_id: "board_1" };
    const calls = [];
    global.fetch = vi.fn(async (url, opts) => {
      calls.push({ url: String(url), opts });
      if (String(url) === KV_URL) return { json: async () => ({ result: JSON.stringify(stored) }) };
      if (String(url) === "https://api.pinterest.com/v5/pins") {
        return { ok: true, json: async () => ({ id: "pin_123" }) };
      }
      throw new Error(`unexpected fetch ${url}`);
    });

    const { publish } = await import("./pinterest.js");
    const result = await publish({ caption: "hello", mediaUrl: "https://example.test/img.jpg" });

    expect(result.ok).toBe(true);
    expect(result.pinId).toBe("pin_123");
    const pinCall = calls.find((c) => c.url === "https://api.pinterest.com/v5/pins");
    const body = JSON.parse(pinCall.opts.body);
    expect(body.board_id).toBe("board_1");
    expect(body.media_source).toEqual({ source_type: "image_url", url: "https://example.test/img.jpg" });
  });

  it("prefers PINTEREST_BOARD_ID over the stored board when both exist", async () => {
    setEnv();
    process.env.PINTEREST_BOARD_ID = "board_override";
    const stored = { access_token: "tok", refresh_token: "rtok", expires_at: Date.now() + 3600_000, board_id: "board_1" };
    global.fetch = vi.fn(async (url, opts) => {
      if (String(url) === KV_URL) return { json: async () => ({ result: JSON.stringify(stored) }) };
      return { ok: true, json: async () => ({ id: "pin_456" }) };
    });
    const { publish } = await import("./pinterest.js");
    await publish({ caption: "hi", mediaUrl: "https://example.test/img.jpg" });
    const call = global.fetch.mock.calls.find((c) => c[0] === "https://api.pinterest.com/v5/pins");
    expect(JSON.parse(call[1].body).board_id).toBe("board_override");
  });
});

describe("verifyConnection", () => {
  it("fetches the account and the first board, storing both", async () => {
    setEnv();
    const stored = { access_token: "tok", refresh_token: "rtok", expires_at: Date.now() + 3600_000 };
    const calls = [];
    global.fetch = vi.fn(async (url, opts) => {
      calls.push({ url: String(url), opts });
      if (String(url) === KV_URL) return { json: async () => ({ result: JSON.stringify(stored) }) };
      if (String(url) === "https://api.pinterest.com/v5/user_account") {
        return { ok: true, json: async () => ({ username: "mybakery" }) };
      }
      if (String(url) === "https://api.pinterest.com/v5/boards") {
        return { ok: true, json: async () => ({ items: [{ id: "board_1", name: "Recipes" }] }) };
      }
      throw new Error(`unexpected fetch ${url}`);
    });

    const { verifyConnection } = await import("./pinterest.js");
    const result = await verifyConnection();

    expect(result.ok).toBe(true);
    expect(result.displayName).toBe("mybakery");
    expect(result.boardId).toBe("board_1");
    const setCall = calls.find((c) => c.url === KV_URL && JSON.parse(c.opts.body)[0] === "SET");
    const saved = JSON.parse(JSON.parse(setCall.opts.body)[2]);
    expect(saved.board_id).toBe("board_1");
  });

  it("skips the boards lookup when PINTEREST_BOARD_ID is already set", async () => {
    setEnv();
    process.env.PINTEREST_BOARD_ID = "board_fixed";
    const stored = { access_token: "tok", refresh_token: "rtok", expires_at: Date.now() + 3600_000 };
    const calls = [];
    global.fetch = vi.fn(async (url) => {
      calls.push(String(url));
      if (String(url) === KV_URL) return { json: async () => ({ result: JSON.stringify(stored) }) };
      if (String(url) === "https://api.pinterest.com/v5/user_account") return { ok: true, json: async () => ({ username: "mybakery" }) };
      throw new Error(`unexpected fetch ${url}`);
    });

    const { verifyConnection } = await import("./pinterest.js");
    const result = await verifyConnection();

    expect(result.boardId).toBe("board_fixed");
    expect(calls).not.toContain("https://api.pinterest.com/v5/boards");
  });

  it("reports verification_failed when the account lookup fails", async () => {
    setEnv();
    const stored = { access_token: "tok", refresh_token: "rtok", expires_at: Date.now() + 3600_000 };
    global.fetch = vi.fn(async (url) => {
      if (String(url) === KV_URL) return { json: async () => ({ result: JSON.stringify(stored) }) };
      return { ok: false, status: 401, json: async () => ({ message: "invalid token" }) };
    });

    const { verifyConnection } = await import("./pinterest.js");
    const result = await verifyConnection();
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("verification_failed");
  });
});
