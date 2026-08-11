// Shared Stripe REST client — no SDK dependency, same convention as
// api/_lib/supabase.js and api/_lib/auth.js. Nothing in this file can
// charge anyone until STRIPE_SECRET_KEY is actually set (ACTIVATION.md);
// until then every exported function returns { ok: false, reason:
// "not_configured" }, matching the publisher adapters' pattern
// (api/_lib/publishers/*.js).

const API_BASE = "https://api.stripe.com/v1";

function secretKey() {
  const key = (process.env.STRIPE_SECRET_KEY || "").trim();
  return key || null;
}

function webhookSecret() {
  const secret = (process.env.STRIPE_WEBHOOK_SECRET || "").trim();
  return secret || null;
}

export function isConfigured() {
  return Boolean(secretKey());
}

function toFormBody(params) {
  const usp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    if (typeof value === "object" && !Array.isArray(value)) {
      for (const [subKey, subValue] of Object.entries(value)) usp.append(`${key}[${subKey}]`, String(subValue));
    } else if (Array.isArray(value)) {
      value.forEach((item, i) => {
        if (typeof item === "object") {
          for (const [subKey, subValue] of Object.entries(item)) usp.append(`${key}[${i}][${subKey}]`, String(subValue));
        } else {
          usp.append(`${key}[${i}]`, String(item));
        }
      });
    } else {
      usp.append(key, String(value));
    }
  }
  return usp;
}

async function request(path, { method = "POST", params } = {}) {
  const key = secretKey();
  if (!key) return { ok: false, reason: "not_configured" };
  const r = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params ? toFormBody(params).toString() : undefined,
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) return { ok: false, reason: "stripe_error", status: r.status, error: data?.error?.message || "Stripe request failed" };
  return { ok: true, data };
}

export async function createCustomer({ email, orgId }) {
  return request("/customers", { params: { email, "metadata[org_id]": orgId } });
}

export async function createCheckoutSession({ customerId, priceId, successUrl, cancelUrl, orgId }) {
  return request("/checkout/sessions", {
    params: {
      customer: customerId,
      mode: "subscription",
      "line_items[0][price]": priceId,
      "line_items[0][quantity]": 1,
      success_url: successUrl,
      cancel_url: cancelUrl,
      "subscription_data[metadata][org_id]": orgId,
    },
  });
}

export async function createPortalSession({ customerId, returnUrl }) {
  return request("/billing_portal/sessions", { params: { customer: customerId, return_url: returnUrl } });
}

// Verifies a Stripe webhook signature per Stripe's documented scheme
// (https://stripe.com/docs/webhooks#verify-manually): header is
// "t=<timestamp>,v1=<hex hmac>[,v0=...]"; signed payload is
// "<timestamp>.<raw body>"; tolerance guards against replay of an old,
// otherwise-valid signature.
export async function verifyWebhookSignature(rawBody, signatureHeader, { toleranceSec = 300 } = {}) {
  const secret = webhookSecret();
  if (!secret) return { ok: false, reason: "not_configured" };
  if (!signatureHeader) return { ok: false, reason: "missing_signature" };

  const parts = Object.fromEntries(
    signatureHeader.split(",").map((kv) => {
      const [k, v] = kv.split("=");
      return [k, v];
    })
  );
  const timestamp = parts.t;
  const v1 = parts.v1;
  if (!timestamp || !v1) return { ok: false, reason: "malformed_signature" };

  const ageSec = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(ageSec) || ageSec > toleranceSec) return { ok: false, reason: "stale_signature" };

  const expected = await hmacSha256Hex(secret, `${timestamp}.${rawBody}`);
  if (expected !== v1) return { ok: false, reason: "signature_mismatch" };
  return { ok: true };
}

async function hmacSha256Hex(key, message) {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey("raw", enc.encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
