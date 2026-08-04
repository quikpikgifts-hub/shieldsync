import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { kv, kvRateLimit } from "./kv.js";

const ORIGINAL_ENV = { ...process.env };

function setKvEnv() {
  process.env.KV_REST_API_URL = "https://kv.example.test";
  process.env.KV_REST_API_TOKEN = "test-token";
}

function clearKvEnv() {
  delete process.env.KV_REST_API_URL;
  delete process.env.KV_REST_API_TOKEN;
}

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.restoreAllMocks();
});

describe("kv()", () => {
  it("returns null when KV env vars are not configured", async () => {
    clearKvEnv();
    const result = await kv("GET", "some:key");
    expect(result).toBeNull();
  });

  it("posts the command array and returns the result field when configured", async () => {
    setKvEnv();
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({ result: "42" }),
    });
    global.fetch = fetchMock;

    const result = await kv("INCR", "rl:test:1");

    expect(result).toBe("42");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://kv.example.test",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer test-token" }),
        body: JSON.stringify(["INCR", "rl:test:1"]),
      })
    );
  });
});

describe("kvRateLimit()", () => {
  const fakeReq = (ip = "1.2.3.4") => ({
    headers: { get: (h) => (h.toLowerCase() === "x-forwarded-for" ? ip : null) },
  });

  it("fails open (not limited) when KV is not configured", async () => {
    clearKvEnv();
    const limited = await kvRateLimit(fakeReq(), { prefix: "test", max: 5, windowSec: 60 });
    expect(limited).toBe(false);
  });

  it("is not limited when the count is under max", async () => {
    setKvEnv();
    global.fetch = vi.fn().mockResolvedValue({ json: async () => ({ result: 3 }) });
    const limited = await kvRateLimit(fakeReq(), { prefix: "test", max: 5, windowSec: 60 });
    expect(limited).toBe(false);
  });

  it("is limited once the count exceeds max", async () => {
    setKvEnv();
    global.fetch = vi.fn().mockResolvedValue({ json: async () => ({ result: 6 }) });
    const limited = await kvRateLimit(fakeReq(), { prefix: "test", max: 5, windowSec: 60 });
    expect(limited).toBe(true);
  });

  it("fails open if the KV call throws", async () => {
    setKvEnv();
    global.fetch = vi.fn().mockRejectedValue(new Error("network down"));
    const limited = await kvRateLimit(fakeReq(), { prefix: "test", max: 5, windowSec: 60 });
    expect(limited).toBe(false);
  });
});
