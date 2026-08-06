import { describe, it, expect, vi, afterEach } from "vitest";
import { supabaseInsert, supabaseSelect } from "./supabase.js";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.restoreAllMocks();
});

describe("supabaseInsert", () => {
  it("skips (does not call fetch) when credentials are missing", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    global.fetch = vi.fn();

    const result = await supabaseInsert("leads", { lead_id: "x" });

    expect(result).toEqual({ skipped: true, reason: "missing" });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("skips when credentials are still template placeholders", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://YOUR-PROJECT.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "real-looking-key";
    global.fetch = vi.fn();

    const result = await supabaseInsert("leads", { lead_id: "x" });

    expect(result).toEqual({ skipped: true, reason: "placeholder" });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("throws with the response body when the insert fails", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.supabase.test";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "real-key";
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 400, text: async () => "bad row" });

    await expect(supabaseInsert("leads", { lead_id: "x" })).rejects.toThrow("bad row");
  });
});

describe("supabaseSelect", () => {
  it("returns null when credentials are missing, instead of throwing", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    const result = await supabaseSelect("leads", "select=*");
    expect(result).toBeNull();
  });
});
