import { describe, it, expect, afterEach } from "vitest";
import { getPublisher, listPublishers } from "./index.js";

const ORIGINAL_ENV = { ...process.env };
afterEach(() => { process.env = { ...ORIGINAL_ENV }; });

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
  it("reports every platform as not configured with no env vars set", () => {
    for (const k of ["META_ACCESS_TOKEN", "META_INSTAGRAM_ACCOUNT_ID", "META_PAGE_ACCESS_TOKEN", "META_FACEBOOK_PAGE_ID",
      "TIKTOK_CLIENT_KEY", "TIKTOK_CLIENT_SECRET", "LINKEDIN_CLIENT_ID", "LINKEDIN_CLIENT_SECRET",
      "GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "X_CLIENT_ID", "X_CLIENT_SECRET",
      "PINTEREST_CLIENT_ID", "PINTEREST_CLIENT_SECRET"]) {
      delete process.env[k];
    }
    const list = listPublishers();
    expect(list).toHaveLength(7);
    expect(list.every((p) => p.configured === false)).toBe(true);
  });

  it("reports a platform as configured once its required env vars are set", () => {
    process.env.META_PAGE_ACCESS_TOKEN = "token";
    process.env.META_FACEBOOK_PAGE_ID = "page-id";
    const facebook = listPublishers().find((p) => p.platform === "facebook");
    expect(facebook.configured).toBe(true);
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
    const publisher = getPublisher("x");
    const longCaption = "a".repeat(300);
    const result = await publisher.publish({ caption: longCaption, userAccessToken: "tok" });
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
