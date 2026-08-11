import { describe, it, expect, vi, afterEach } from "vitest";
import { CONNECTION_STATES } from "./states.js";

const ORIGINAL_ENV = { ...process.env };

function setEnv() {
  process.env.META_ACCESS_TOKEN = "ig-token";
  process.env.META_INSTAGRAM_ACCOUNT_ID = "ig-account-id";
}

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.restoreAllMocks();
});

describe("getConnectionState", () => {
  it("is waiting_for_credentials when env vars are missing", async () => {
    delete process.env.META_ACCESS_TOKEN;
    const { getConnectionState } = await import("./instagram.js");
    const result = await getConnectionState();
    expect(result.state).toBe(CONNECTION_STATES.WAITING_FOR_CREDENTIALS);
  });

  it("is connected as soon as the static token is configured", async () => {
    setEnv();
    const { getConnectionState } = await import("./instagram.js");
    const result = await getConnectionState();
    expect(result.state).toBe(CONNECTION_STATES.CONNECTED);
  });
});

describe("publish", () => {
  it("returns not_configured when env vars are missing", async () => {
    delete process.env.META_ACCESS_TOKEN;
    const { publish } = await import("./instagram.js");
    const result = await publish({ caption: "hi", mediaUrl: "https://example.test/img.jpg" });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("not_configured");
  });

  it("requires mediaUrl even when configured", async () => {
    setEnv();
    const { publish } = await import("./instagram.js");
    const result = await publish({ caption: "hi" });
    expect(result.reason).toBe("media_required");
  });

  it("creates a media container then publishes it (two-step flow)", async () => {
    setEnv();
    const calls = [];
    global.fetch = vi.fn(async (url, opts) => {
      calls.push({ url: String(url), opts });
      if (String(url) === "https://graph.facebook.com/v19.0/ig-account-id/media") {
        return { ok: true, json: async () => ({ id: "container_123" }) };
      }
      if (String(url) === "https://graph.facebook.com/v19.0/ig-account-id/media_publish") {
        return { ok: true, json: async () => ({ id: "media_456" }) };
      }
      throw new Error(`unexpected fetch ${url}`);
    });
    const { publish } = await import("./instagram.js");

    const result = await publish({ caption: "hello", hashtags: "#launch", mediaUrl: "https://example.test/img.jpg" });

    expect(result.ok).toBe(true);
    expect(result.mediaId).toBe("media_456");
    expect(calls[0].opts.body).toContain(encodeURIComponent("https://example.test/img.jpg"));
    expect(calls[1].opts.body).toContain("creation_id=container_123");
  });

  it("surfaces a container-creation error without attempting to publish", async () => {
    setEnv();
    const calls = [];
    global.fetch = vi.fn(async (url, opts) => {
      calls.push(String(url));
      return { ok: false, status: 400, json: async () => ({ error: { message: "Invalid image URL" } }) };
    });
    const { publish } = await import("./instagram.js");

    const result = await publish({ caption: "hi", mediaUrl: "https://example.test/bad.jpg" });

    expect(result.ok).toBe(false);
    expect(result.detail).toBe("Invalid image URL");
    expect(calls).toHaveLength(1); // never reached media_publish
  });

  it("surfaces a publish-step error after a successful container creation", async () => {
    setEnv();
    global.fetch = vi.fn(async (url) => {
      if (String(url) === "https://graph.facebook.com/v19.0/ig-account-id/media") {
        return { ok: true, json: async () => ({ id: "container_123" }) };
      }
      return { ok: false, status: 500, json: async () => ({ error: { message: "Publish failed" } }) };
    });
    const { publish } = await import("./instagram.js");

    const result = await publish({ caption: "hi", mediaUrl: "https://example.test/img.jpg" });

    expect(result.ok).toBe(false);
    expect(result.detail).toBe("Publish failed");
  });
});
