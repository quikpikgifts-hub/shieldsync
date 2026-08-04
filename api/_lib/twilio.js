// Twilio request-signature verification (edge runtime, Web Crypto — no SDK dependency).
// Algorithm: https://www.twilio.com/docs/usage/security#validating-requests
//
// IMPORTANT: `url` must exactly match the webhook URL configured in the Twilio console
// (protocol + host + path + query string) or every request will fail verification.

async function hmacSha1Base64(key, message) {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(key),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(message));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}

export async function verifyTwilioSignature(req, url, params) {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const signature = req.headers.get("x-twilio-signature") || "";
  if (!authToken || !signature) return false;

  let data = url;
  for (const key of [...params.keys()].sort()) {
    data += key + params.get(key);
  }

  const expected = await hmacSha1Base64(authToken, data);
  return timingSafeEqual(expected, signature);
}

// Consolidates the sendSMS() copies previously duplicated in sms.js and missed-call.js.
export async function sendSMS(to, body, logPrefix = "twilio") {
  const sid   = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from  = process.env.TWILIO_PHONE_NUMBER;
  if (!sid || !token || !from) {
    console.error(`[${logPrefix}] Twilio env vars missing (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER)`);
    return { ok: false, error: "SMS not configured" };
  }
  try {
    const r = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${btoa(`${sid}:${token}`)}`,
        },
        body: new URLSearchParams({ To: to, From: from, Body: body }).toString(),
      }
    );
    const data = await r.json().catch(() => ({}));
    if (!r.ok) console.error(`[${logPrefix}] SMS send failed:`, data);
    return { ok: r.ok, sid: data.sid };
  } catch (err) {
    console.error(`[${logPrefix}] sendSMS error:`, err?.message);
    return { ok: false, error: err?.message };
  }
}
