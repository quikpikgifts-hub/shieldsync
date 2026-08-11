import { describe, it, expect, vi, afterEach } from "vitest";
import { CONNECTION_STATES } from "./states.js";

const ORIGINAL_ENV = { ...process.env };
const KV_URL = "https://kv.example.test";

function setEnv() {
  process.env.KV_REST_API_URL = KV_URL;
  process.env.KV_REST_API_TOKEN = "kv-token";
  process.env.X_CLIENT_ID = "client-id";
  process.env.X_CLIENT_SECRET = "client-secret";
  process.env.X_REDIRECT_URI = "https://example.test/api/social/oauth/x/callback";
}

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.restoreAllMocks();
});

describe("PKCE helpers", () => {
  it("generates a code_verifier and a matching S256 code_challenge", async () => {
    const { generateCodeVerifier, generateCodeChallenge } = await import("./x.js");
    const verifier = generateCodeVerifier();
    expect(verifier.length).toBeGreaterThanOrEqual(43);
    expect(verifier).toMatch(/^[A-Za-z0-9_-]+$/); // base64url alphabet only

    const challenge = await generateCodeChallenge(verifier);
    expect(challenge).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(challenge).not.toBe(verifier);
    // Deterministic: same verifier always produces the same challenge.
    expect(await generateCodeChallenge(verifier)).toBe(challenge);
  });
});

describe("buildAuthorizeUrl", () => {
  it("includes client_id, redirect_uri, state, and the PKCE challenge", async () => {
    setEnv();
    const { buildAuthorizeUrl } = await import("./x.js");
    const url = buildAuthorizeUrl("abc123", "challenge-xyz");
    expect(url).toContain("client_id=client-id");
    expect(url).toContain("state=abc123");
    expect(url).toContain("code_challenge=challenge-xyz");
    expect(url).toContain("code_challenge_method=S256");
    expect(url).toContain(encodeURIComponent("https://example.test/api/social/oauth/x/callback"));
    expect(url).toContain("tweet.write");
  });
});

describe("storeOAuthState / consumeOAuthState", () => {
  it("round-trips the code_verifier through KV and deletes it after one use", async () => {
    setEnv();
    const calls = [];
    global.fetch = vi.fn(async (url, opts) => {
      calls.push({ url: String(url), opts, cmd: JSON.parse(opts.body)[0] });
      const cmd = JSON.parse(opts.body)[0];
      if (cmd === "GET") return { json: async () => ({ result: "the-verifier" }) };
      return { json: async () => ({ result: "OK" }) };
    });
    const { storeOAuthState, consumeOAuthState } = await import("./x.js");

    await storeOAuthState("state1", "the-verifier");
    const verifier = await consumeOAuthState("state1");

    expect(verifier).toBe("the-verifier");
    expect(calls.some((c) => c.cmd === "SET")).toBe(true);
    expect(calls.some((c) => c.cmd === "DEL")).toBe(true);
  });

  it("returns null for an unknown or already-consumed state", async () => {
    setEnv();
    global.fetch = vi.fn().mockResolvedValue({ json: async () => ({ result: null }) });
    const { consumeOAuthState } = await import("./x.js");
    expect(await consumeOAuthState("nope")).toBeNull();
  });
});

describe("getConnectionState", () => {
  it("is waiting_for_credentials when env vars are missing", async () => {
    delete process.env.X_CLIENT_ID;
    const { getConnectionState } = await import("./x.js");
    const result = await getConnectionState();
    expect(result.state).toBe(CONNECTION_STATES.WAITING_FOR_CREDENTIALS);
  });

  it("is ready_to_activate when configured but no account token stored", async () => {
    setEnv();
    global.fetch = vi.fn().mockResolvedValue({ json: async () => ({ result: null }) });
    const { getConnectionState } = await import("./x.js");
    const result = await getConnectionState();
    expect(result.state).toBe(CONNECTION_STATES.READY_TO_ACTIVATE);
  });

  it("is connected when a valid, non-expired token is stored", async () => {
    setEnv();
    const stored = { access_token: "tok", refresh_token: "rtok", expires_at: Date.now() + 3600_000 };
    global.fetch = vi.fn().mockResolvedValue({ json: async () => ({ result: JSON.stringify(stored) }) });
    const { getConnectionState } = await import("./x.js");
    const result = await getConnectionState();
    expect(result.state).toBe(CONNECTION_STATES.CONNECTED);
  });
});

describe("publish", () => {
  it("returns not_configured when env vars are missing", async () => {
    delete process.env.X_CLIENT_ID;
    const { publish } = await import("./x.js");
    const result = await publish({ caption: "hi" });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("not_configured");
  });

  it("requires a non-empty caption even when configured", async () => {
    setEnv();
    const { publish } = await import("./x.js");
    const result = await publish({ caption: "" });
    expect(result.reason).toBe("caption_required");
  });

  it("enforces the 280-character limit", async () => {
    setEnv();
    const { publish } = await import("./x.js");
    const result = await publish({ caption: "a".repeat(300) });
    expect(result.reason).toBe("over_character_limit");
  });

  it("returns account_not_connected when no token is stored", async () => {
    setEnv();
    global.fetch = vi.fn().mockResolvedValue({ json: async () => ({ result: null }) });
    const { publish } = await import("./x.js");
    const result = await publish({ caption: "hi" });
    expect(result.reason).toBe("account_not_connected");
  });

  it("posts to /2/tweets with a valid stored token", async () => {
    setEnv();
    const stored = { access_token: "tok", refresh_token: "rtok", expires_at: Date.now() + 3600_000 };
    const calls = [];
    global.fetch = vi.fn(async (url, opts) => {
      calls.push({ url: String(url), opts });
      if (String(url) === KV_URL) return { json: async () => ({ result: JSON.stringify(stored) }) };
      if (String(url) === "https://api.twitter.com/2/tweets") {
        return { ok: true, json: async () => ({ data: { id: "tweet_123" } }) };
      }
      throw new Error(`unexpected fetch ${url}`);
    });

    const { publish } = await import("./x.js");
    const result = await publish({ caption: "hello world", hashtags: "#launch" });

    expect(result.ok).toBe(true);
    expect(result.tweetId).toBe("tweet_123");
    const tweetCall = calls.find((c) => c.url === "https://api.twitter.com/2/tweets");
    expect(tweetCall.opts.headers.Authorization).toBe("Bearer tok");
    expect(JSON.parse(tweetCall.opts.body).text).toBe("hello world\n\n#launch");
  });

  it("refreshes an expired token before publishing, using Basic client auth", async () => {
    setEnv();
    const expired = { access_token: "old", refresh_token: "rtok", expires_at: Date.now() - 1000 };
    const refreshed = { access_token: "new", refresh_token: "rtok2", expires_in: 7200 };
    const calls = [];
    global.fetch = vi.fn(async (url, opts) => {
      calls.push({ url: String(url), opts });
      if (String(url) === KV_URL) {
        const [cmd] = JSON.parse(opts.body);
        if (cmd === "GET") return { json: async () => ({ result: JSON.stringify(expired) }) };
        return { json: async () => ({ result: "OK" }) }; // SET after refresh
      }
      if (String(url) === "https://api.twitter.com/2/oauth2/token") {
        return { ok: true, json: async () => (refreshed) };
      }
      if (String(url) === "https://api.twitter.com/2/tweets") {
        return { ok: true, json: async () => ({ data: { id: "tweet_456" } }) };
      }
      throw new Error(`unexpected fetch ${url}`);
    });

    const { publish } = await import("./x.js");
    const result = await publish({ caption: "hi" });

    expect(result.ok).toBe(true);
    const refreshCall = calls.find((c) => c.url === "https://api.twitter.com/2/oauth2/token");
    expect(refreshCall.opts.headers.Authorization).toMatch(/^Basic /);
    const tweetCall = calls.find((c) => c.url === "https://api.twitter.com/2/tweets");
    expect(tweetCall.opts.headers.Authorization).toBe("Bearer new");
  });

  it("does not attempt to refresh without a refresh_token (no offline.access grant)", async () => {
    setEnv();
    const expired = { access_token: "old", refresh_token: null, expires_at: Date.now() - 1000 };
    global.fetch = vi.fn().mockResolvedValue({ json: async () => ({ result: JSON.stringify(expired) }) });
    const { publish } = await import("./x.js");
    const result = await publish({ caption: "hi" });
    expect(result.reason).toBe("account_not_connected");
  });
});

describe("verifyConnection", () => {
  it("calls /2/users/me and records last_verified_at + display name on success", async () => {
    setEnv();
    const stored = { access_token: "tok", refresh_token: "rtok", expires_at: Date.now() + 3600_000 };
    const calls = [];
    global.fetch = vi.fn(async (url, opts) => {
      calls.push({ url: String(url), opts });
      if (String(url) === KV_URL) return { json: async () => ({ result: JSON.stringify(stored) }) };
      if (String(url) === "https://api.twitter.com/2/users/me") {
        return { ok: true, json: async () => ({ data: { username: "mybakery", name: "My Bakery" } }) };
      }
      throw new Error(`unexpected fetch ${url}`);
    });

    const { verifyConnection } = await import("./x.js");
    const result = await verifyConnection();

    expect(result.ok).toBe(true);
    expect(result.displayName).toBe("My Bakery");
    const setCall = calls.find((c) => c.url === KV_URL && JSON.parse(c.opts.body)[0] === "SET");
    const savedRecord = JSON.parse(JSON.parse(setCall.opts.body)[2]);
    expect(savedRecord.display_name).toBe("My Bakery");
  });

  it("reports verification_failed when X's API rejects the token", async () => {
    setEnv();
    const stored = { access_token: "tok", refresh_token: "rtok", expires_at: Date.now() + 3600_000 };
    global.fetch = vi.fn(async (url) => {
      if (String(url) === KV_URL) return { json: async () => ({ result: JSON.stringify(stored) }) };
      if (String(url) === "https://api.twitter.com/2/users/me") {
        return { ok: false, status: 401, json: async () => ({ detail: "Unauthorized" }) };
      }
      throw new Error(`unexpected fetch ${url}`);
    });

    const { verifyConnection } = await import("./x.js");
    const result = await verifyConnection();
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("verification_failed");
  });
});
