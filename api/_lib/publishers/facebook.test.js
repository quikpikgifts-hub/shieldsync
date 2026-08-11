import { describe, it, expect, vi, afterEach } from "vitest";
import { CONNECTION_STATES } from "./states.js";

const ORIGINAL_ENV = { ...process.env };

function setEnv() {
  process.env.META_PAGE_ACCESS_TOKEN = "page-token";
  process.env.META_FACEBOOK_PAGE_ID = "page-id";
}

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.restoreAllMocks();
});

describe("getConnectionState", () => {
  it("is waiting_for_credentials when env vars are missing", async () => {
    delete process.env.META_PAGE_ACCESS_TOKEN;
    const { getConnectionState } = await import("./facebook.js");
    const result = await getConnectionState();
    expect(result.state).toBe(CONNECTION_STATES.WAITING_FOR_CREDENTIALS);
  });

  it("is connected as soon as the static token is configured (no separate connect step)", async () => {
    setEnv();
    const { getConnectionState } = await import("./facebook.js");
    const result = await getConnectionState();
    expect(result.state).toBe(CONNECTION_STATES.CONNECTED);
  });
});

describe("publish", () => {
  it("returns not_configured when env vars are missing", async () => {
    delete process.env.META_PAGE_ACCESS_TOKEN;
    const { publish } = await import("./facebook.js");
    const result = await publish({ caption: "hi" });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("not_configured");
  });

  it("requires a non-empty caption even when configured", async () => {
    setEnv();
    const { publish } = await import("./facebook.js");
    const result = await publish({ caption: "" });
    expect(result.reason).toBe("caption_required");
  });

  it("posts text-only content to /{page-id}/feed", async () => {
    setEnv();
    const calls = [];
    global.fetch = vi.fn(async (url, opts) => {
      calls.push({ url: String(url), opts });
      return { ok: true, json: async () => ({ id: "page-id_post-id", post_id: "page-id_post-id" }) };
    });
    const { publish } = await import("./facebook.js");

    const result = await publish({ caption: "hello world" });

    expect(result.ok).toBe(true);
    expect(result.postId).toBe("page-id_post-id");
    expect(calls[0].url).toBe("https://graph.facebook.com/v19.0/page-id/feed");
    expect(calls[0].opts.body).toContain("message=hello");
  });

  it("posts to /{page-id}/photos when mediaUrl is present", async () => {
    setEnv();
    const calls = [];
    global.fetch = vi.fn(async (url, opts) => {
      calls.push({ url: String(url), opts });
      return { ok: true, json: async () => ({ id: "photo-id", post_id: "page-id_photo-id" }) };
    });
    const { publish } = await import("./facebook.js");

    const result = await publish({ caption: "look at this", mediaUrl: "https://example.test/img.jpg" });

    expect(result.ok).toBe(true);
    expect(calls[0].url).toBe("https://graph.facebook.com/v19.0/page-id/photos");
    expect(calls[0].opts.body).toContain(encodeURIComponent("https://example.test/img.jpg"));
  });

  it("surfaces a Graph API error instead of throwing", async () => {
    setEnv();
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 400, json: async () => ({ error: { message: "Invalid OAuth access token" } }) });
    const { publish } = await import("./facebook.js");

    const result = await publish({ caption: "hi" });

    expect(result.ok).toBe(false);
    expect(result.reason).toBe("publish_error");
    expect(result.detail).toBe("Invalid OAuth access token");
  });
});
