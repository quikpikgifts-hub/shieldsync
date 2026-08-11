import { describe, it, expect, vi, afterEach } from "vitest";

const ORIGINAL_ENV = { ...process.env };

function setEnv() {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.supabase.test";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
}

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.restoreAllMocks();
});

describe("getEntitlement", () => {
  it("defaults to unmetered when no entitlement row exists (pre-billing)", async () => {
    setEnv();
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => [] });
    const { getEntitlement } = await import("./entitlements.js");

    const result = await getEntitlement("org1", "social");

    expect(result).toEqual({ status: "unmetered", source: "default" });
  });

  it("defaults to unmetered when Supabase isn't configured, instead of throwing", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    const { getEntitlement } = await import("./entitlements.js");

    const result = await getEntitlement("org1", "social");

    expect(result.status).toBe("unmetered");
  });

  it("returns the real status once a billing record exists", async () => {
    setEnv();
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => [{ status: "active", updated_at: "2026-08-10T00:00:00Z" }] });
    const { getEntitlement } = await import("./entitlements.js");

    const result = await getEntitlement("org1", "social");

    expect(result.status).toBe("active");
    expect(result.source).toBe("billing");
  });
});
