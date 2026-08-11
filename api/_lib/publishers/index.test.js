import { describe, it, expect, afterEach, vi } from "vitest";
import { getPublisher, listPublishers, verifyPublisherConnection } from "./index.js";

const ALL_ENV_VARS = [
  "META_ACCESS_TOKEN", "META_INSTAGRAM_ACCOUNT_ID", "META_PAGE_ACCESS_TOKEN", "META_FACEBOOK_PAGE_ID",
  "TIKTOK_CLIENT_KEY", "TIKTOK_CLIENT_SECRET", "TIKTOK_REDIRECT_URI",
  "LINKEDIN_CLIENT_ID", "LINKEDIN_CLIENT_SECRET", "LINKEDIN_REDIRECT_URI",
  "GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "X_CLIENT_ID", "X_CLIENT_SECRET", "X_REDIRECT_URI",
  "PINTEREST_CLIENT_ID", "PINTEREST_CLIENT_SECRET",
];

const ORIGINAL_ENV = { ...process.env };
afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.restoreAllMocks();
});

describe("getPublisher", () => {
  it("resolves all 7 pilot platforms", () => {
    for (const p of ["facebook", "instagram", "tiktok", "linkedin", "youtube", "x", "pinterest"]) {
      expect(getPublisher(p)).toBeTruthy();
      expect(getPublisher(p).platform).toBe(p);
    }
  });

  it("returns null for an unknown platform", () => {
    expect(getPublisher("myspace")).toBeNull();
  });
});

describe("listPublishers", () => {
  it("reports every platform as waiting_for_credentials with no env vars set", async () => {
    for (const k of ALL_ENV_VARS) delete process.env[k];
    const list = await listPublishers();
    expect(list).toHaveLength(7);
    expect(list.every((p) => p.state === "waiting_for_credentials")).toBe(true);
    expect(list.every((p) => p.configured === false)).toBe(true);
    expect(list.find((p) => p.platform === "tiktok").label).toBe("Waiting for Credentials");
  });

  it("moves a still-credentials-only platform (YouTube) to configuration_required once its env vars are set", async () => {
    for (const k of ALL_ENV_VARS) delete process.env[k];
    process.env.GOOGLE_CLIENT_ID = "id";
    process.env.GOOGLE_CLIENT_SECRET = "secret";
    const youtube = (await listPublishers()).find((p) => p.platform === "youtube");
    expect(youtube.state).toBe("configuration_required");
    expect(youtube.configured).toBe(true);
  });

  it("Facebook (static Page token, no OAuth step) goes straight to connected once its env vars are set", async () => {
    for (const k of ALL_ENV_VARS) delete process.env[k];
    process.env.META_PAGE_ACCESS_TOKEN = "token";
    process.env.META_FACEBOOK_PAGE_ID = "page-id";
    const facebook = (await listPublishers()).find((p) => p.platform === "facebook");
    expect(facebook.state).toBe("connected");
    expect(facebook.configured).toBe(true);
  });

  it("moves TikTok to ready_to_activate once app-level env vars are set but no account is connected", async () => {
    for (const k of ALL_ENV_VARS) delete process.env[k];
    process.env.KV_REST_API_URL = "https://kv.example.test";
    process.env.KV_REST_API_TOKEN = "kv-token";
    process.env.TIKTOK_CLIENT_KEY = "key";
    process.env.TIKTOK_CLIENT_SECRET = "secret";
    process.env.TIKTOK_REDIRECT_URI = "https://example.test/callback";
    global.fetch = vi.fn().mockResolvedValue({ json: async () => ({ result: null }) });

    const tiktok = (await listPublishers()).find((p) => p.platform === "tiktok");
    expect(tiktok.state).toBe("ready_to_activate");
  });

  it("includes requiredScopes for every platform", async () => {
    const list = await listPublishers();
    expect(list.every((p) => Array.isArray(p.requiredScopes) && p.requiredScopes.length > 0)).toBe(true);
  });

  it("only reports oauthAvailable for platforms with a real OAuth flow built (TikTok, X, LinkedIn)", async () => {
    const list = await listPublishers();
    for (const platform of ["tiktok", "x", "linkedin"]) {
      expect(list.find((p) => p.platform === platform).oauthAvailable).toBe(true);
    }
    // Facebook/Instagram are real too, but use a static token with no
    // verifyConnection/OAuth flow (see their own files' header comments).
    for (const platform of ["facebook", "instagram", "youtube", "pinterest"]) {
      expect(list.find((p) => p.platform === platform).oauthAvailable).toBe(false);
    }
  });
});

describe("verifyPublisherConnection", () => {
  it("returns not_available for platforms without a real verify implementation", async () => {
    const result = await verifyPublisherConnection("facebook");
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("not_available");
  });

  it("returns not_available for an unknown platform", async () => {
    const result = await verifyPublisherConnection("myspace");
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("not_available");
  });

  it("delegates to TikTok's real verifyConnection", async () => {
    for (const k of ALL_ENV_VARS) delete process.env[k];
    const result = await verifyPublisherConnection("tiktok");
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("not_configured"); // no env vars set in this test
  });

  it("delegates to X's real verifyConnection", async () => {
    for (const k of ALL_ENV_VARS) delete process.env[k];
    const result = await verifyPublisherConnection("x");
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("not_configured"); // no env vars set in this test
  });

  it("delegates to LinkedIn's real verifyConnection", async () => {
    for (const k of ALL_ENV_VARS) delete process.env[k];
    const result = await verifyPublisherConnection("linkedin");
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("not_configured"); // no env vars set in this test
  });
});

describe("publish() before credentials exist", () => {
  it("returns not_configured instead of throwing, for every platform", async () => {
    for (const key of ["facebook", "instagram", "tiktok", "linkedin", "youtube", "x", "pinterest"]) {
      const publisher = getPublisher(key);
      const result = await publisher.publish({ caption: "hi" });
      expect(result.ok).toBe(false);
      expect(result.reason).toBe("not_configured");
    }
  });

  it("x publisher enforces the 280-character limit once configured", async () => {
    process.env.X_CLIENT_ID = "id";
    process.env.X_CLIENT_SECRET = "secret";
    process.env.X_REDIRECT_URI = "https://example.test/api/social/oauth/x/callback";
    const publisher = getPublisher("x");
    const longCaption = "a".repeat(300);
    const result = await publisher.publish({ caption: longCaption });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("over_character_limit");
  });

  it("instagram requires media even once configured", async () => {
    process.env.META_ACCESS_TOKEN = "token";
    process.env.META_INSTAGRAM_ACCOUNT_ID = "acct";
    const publisher = getPublisher("instagram");
    const result = await publisher.publish({ caption: "hi" });
    expect(result.reason).toBe("media_required");
  });
});
