// Shared Vercel KV (Upstash REST) client + rate limiter.
// Consolidates the kv()/kvRateLimit() copies previously duplicated across
// contact.js, book.js, chat.js, ai.js, leads.js, follow-up.js, metrics.js.

export async function kv(cmd, ...args) {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  const r = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify([cmd, ...args]),
  });
  const data = await r.json();
  return data.result;
}

// Fails open when KV isn't configured — matches the existing behavior of every
// rate-limited route in this codebase (an unconfigured KV disables rate
// limiting rather than blocking all traffic).
export async function kvRateLimit(req, { prefix, max = 5, windowSec = 3600 }) {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return false;
  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "anon";
  const bucket = Math.floor(Date.now() / 1000 / windowSec);
  const key = `rl:${prefix}:${ip}:${bucket}`;
  try {
    const count = await kv("INCR", key);
    if (count === 1) await kv("EXPIRE", key, windowSec * 2);
    return count > max;
  } catch {
    return false;
  }
}
