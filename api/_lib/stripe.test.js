import { describe, it, expect, vi, afterEach } from "vitest";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.restoreAllMocks();
});

async function sign(secret, message) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

describe("isConfigured", () => {
  it("is false without STRIPE_SECRET_KEY", async () => {
    delete process.env.STRIPE_SECRET_KEY;
    const { isConfigured } = await import("./stripe.js");
    expect(isConfigured()).toBe(false);
  });

  it("is true once STRIPE_SECRET_KEY is set", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_123";
    const { isConfigured } = await import("./stripe.js");
    expect(isConfigured()).toBe(true);
  });
});

describe("createCustomer", () => {
  it("returns not_configured without calling fetch when no key is set", async () => {
    delete process.env.STRIPE_SECRET_KEY;
    global.fetch = vi.fn();
    const { createCustomer } = await import("./stripe.js");

    const result = await createCustomer({ email: "a@example.com", orgId: "org1" });

    expect(result).toEqual({ ok: false, reason: "not_configured" });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("posts form-encoded params with the secret key as a bearer token", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_123";
    const calls = [];
    global.fetch = vi.fn(async (url, opts) => {
      calls.push({ url: String(url), opts });
      return { ok: true, json: async () => ({ id: "cus_123" }) };
    });
    const { createCustomer } = await import("./stripe.js");

    const result = await createCustomer({ email: "a@example.com", orgId: "org1" });

    expect(result.ok).toBe(true);
    expect(result.data.id).toBe("cus_123");
    expect(calls[0].url).toBe("https://api.stripe.com/v1/customers");
    expect(calls[0].opts.headers.Authorization).toBe("Bearer sk_test_123");
    expect(calls[0].opts.body).toContain("email=a%40example.com");
    expect(calls[0].opts.body).toContain("metadata%5Borg_id%5D=org1");
  });

  it("surfaces a Stripe error message instead of throwing", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_123";
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 402, json: async () => ({ error: { message: "Your card was declined." } }) });
    const { createCustomer } = await import("./stripe.js");

    const result = await createCustomer({ email: "a@example.com", orgId: "org1" });

    expect(result.ok).toBe(false);
    expect(result.error).toBe("Your card was declined.");
  });
});

describe("verifyWebhookSignature", () => {
  it("returns not_configured without a webhook secret set", async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;
    const { verifyWebhookSignature } = await import("./stripe.js");
    const result = await verifyWebhookSignature("{}", "t=1,v1=abc");
    expect(result).toEqual({ ok: false, reason: "not_configured" });
  });

  it("rejects a missing signature header", async () => {
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
    const { verifyWebhookSignature } = await import("./stripe.js");
    const result = await verifyWebhookSignature("{}", null);
    expect(result).toEqual({ ok: false, reason: "missing_signature" });
  });

  it("rejects a malformed signature header", async () => {
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
    const { verifyWebhookSignature } = await import("./stripe.js");
    const result = await verifyWebhookSignature("{}", "not-a-real-header");
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("malformed_signature");
  });

  it("rejects a stale timestamp outside the tolerance window", async () => {
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
    const { verifyWebhookSignature } = await import("./stripe.js");
    const oldTimestamp = Math.floor(Date.now() / 1000) - 10_000;
    const sig = await sign("whsec_test", `${oldTimestamp}.{}`);
    const result = await verifyWebhookSignature("{}", `t=${oldTimestamp},v1=${sig}`);
    expect(result).toEqual({ ok: false, reason: "stale_signature" });
  });

  it("rejects a signature computed with the wrong secret", async () => {
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
    const { verifyWebhookSignature } = await import("./stripe.js");
    const timestamp = Math.floor(Date.now() / 1000);
    const sig = await sign("wrong-secret", `${timestamp}.{}`);
    const result = await verifyWebhookSignature("{}", `t=${timestamp},v1=${sig}`);
    expect(result).toEqual({ ok: false, reason: "signature_mismatch" });
  });

  it("accepts a validly signed, fresh payload", async () => {
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
    const { verifyWebhookSignature } = await import("./stripe.js");
    const timestamp = Math.floor(Date.now() / 1000);
    const body = JSON.stringify({ type: "customer.subscription.updated" });
    const sig = await sign("whsec_test", `${timestamp}.${body}`);
    const result = await verifyWebhookSignature(body, `t=${timestamp},v1=${sig}`);
    expect(result).toEqual({ ok: true });
  });
});
