import { describe, it, expect, vi, afterEach } from "vitest";
import { recordLead, scheduleFollowUps } from "./store.js";

const ORIGINAL_ENV = { ...process.env };
const KV_URL = "https://kv.example.test";
const SB_URL = "https://project.supabase.example.test";

function setEnv() {
  process.env.KV_REST_API_URL = KV_URL;
  process.env.KV_REST_API_TOKEN = "kv-token";
  process.env.NEXT_PUBLIC_SUPABASE_URL = SB_URL;
  process.env.SUPABASE_SERVICE_ROLE_KEY = "sb-key";
}

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.restoreAllMocks();
});

describe("recordLead", () => {
  it("writes to both KV and Supabase — the Sprint 0b fix for assessment leads", async () => {
    setEnv();
    const calls = [];
    global.fetch = vi.fn(async (url, opts) => {
      calls.push({ url: String(url), opts });
      if (String(url) === KV_URL) return { json: async () => ({ result: "OK" }) };
      if (String(url).includes("/rest/v1/leads")) {
        return { ok: true, status: 201, text: async () => "[]" };
      }
      throw new Error(`unexpected fetch to ${url}`);
    });

    const entry = {
      leadId: "asmnt_123",
      priority: "HOT",
      challenge: "Assessment score: 30/100",
      contact: { name: "Jamie Lee", email: "jamie@example.test", phone: "", business: "" },
    };

    const { kvResult, sbResult } = await recordLead(entry);

    // Two KV calls (SET + LPUSH) and one Supabase insert call.
    const kvCalls = calls.filter((c) => c.url === KV_URL);
    const sbCalls = calls.filter((c) => c.url.includes("/rest/v1/leads"));
    expect(kvCalls.length).toBe(2);
    expect(sbCalls.length).toBe(1);

    const sbBody = JSON.parse(sbCalls[0].opts.body);
    expect(sbBody.lead_id).toBe("asmnt_123");
    expect(sbBody.email).toBe("jamie@example.test");
    expect(sbBody.priority).toBe("HOT");

    expect(sbResult.ok).toBe(true);
    expect(kvResult.every((r) => r.status === "fulfilled")).toBe(true);
  });

  it("still succeeds the KV write even if the Supabase write fails", async () => {
    setEnv();
    global.fetch = vi.fn(async (url) => {
      if (String(url) === KV_URL) return { json: async () => ({ result: "OK" }) };
      return { ok: false, status: 500, text: async () => "supabase down" };
    });

    const { kvResult, sbResult } = await recordLead({
      leadId: "vrd_1",
      priority: "LOW",
      contact: { name: "A", email: "a@example.test" },
    });

    expect(kvResult.every((r) => r.status === "fulfilled")).toBe(true);
    expect(sbResult.ok).toBe(false);
  });
});

describe("scheduleFollowUps", () => {
  it("issues one ZADD per requested sequence key", async () => {
    setEnv();
    const zaddCalls = [];
    global.fetch = vi.fn(async (url, opts) => {
      const [cmd, key] = JSON.parse(opts.body);
      if (cmd === "ZADD") zaddCalls.push(key);
      return { json: async () => ({ result: "OK" }) };
    });

    await scheduleFollowUps("lead_1", ["24h", "3d"]);

    expect(zaddCalls.sort()).toEqual(["veridian:fu:24h", "veridian:fu:3d"]);
  });
});
