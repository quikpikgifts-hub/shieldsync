import { describe, it, expect, afterEach } from "vitest";
import { createHmac } from "node:crypto";
import { verifyTwilioSignature, sendSMS } from "./twilio.js";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

// Independently computes the expected Twilio signature (via node:crypto, not
// the Web Crypto implementation under test) to avoid a tautological test.
function expectedSignature(authToken, url, params) {
  let data = url;
  for (const key of [...params.keys()].sort()) {
    data += key + params.get(key);
  }
  return createHmac("sha1", authToken).update(data, "utf8").digest("base64");
}

function fakeReq(signature) {
  return { headers: { get: (h) => (h.toLowerCase() === "x-twilio-signature" ? signature : null) } };
}

describe("verifyTwilioSignature", () => {
  const url = "https://example.test/api/sms";
  const params = new URLSearchParams({ From: "+15551234567", Body: "hello" });

  it("accepts a correctly computed signature", async () => {
    process.env.TWILIO_AUTH_TOKEN = "secret-token";
    const sig = expectedSignature("secret-token", url, params);
    const ok = await verifyTwilioSignature(fakeReq(sig), url, params);
    expect(ok).toBe(true);
  });

  it("rejects a tampered signature", async () => {
    process.env.TWILIO_AUTH_TOKEN = "secret-token";
    const ok = await verifyTwilioSignature(fakeReq("not-the-real-signature=="), url, params);
    expect(ok).toBe(false);
  });

  it("rejects when TWILIO_AUTH_TOKEN is not configured (fail closed)", async () => {
    delete process.env.TWILIO_AUTH_TOKEN;
    const sig = expectedSignature("secret-token", url, params);
    const ok = await verifyTwilioSignature(fakeReq(sig), url, params);
    expect(ok).toBe(false);
  });

  it("rejects when the request has no signature header", async () => {
    process.env.TWILIO_AUTH_TOKEN = "secret-token";
    const ok = await verifyTwilioSignature(fakeReq(""), url, params);
    expect(ok).toBe(false);
  });

  it("rejects when the signature was computed for a different URL", async () => {
    process.env.TWILIO_AUTH_TOKEN = "secret-token";
    const sig = expectedSignature("secret-token", "https://example.test/api/other", params);
    const ok = await verifyTwilioSignature(fakeReq(sig), url, params);
    expect(ok).toBe(false);
  });
});

describe("sendSMS", () => {
  it("fails without calling Twilio when env vars are missing", async () => {
    delete process.env.TWILIO_ACCOUNT_SID;
    delete process.env.TWILIO_AUTH_TOKEN;
    delete process.env.TWILIO_PHONE_NUMBER;
    const result = await sendSMS("+15550000000", "hi");
    expect(result.ok).toBe(false);
  });
});
