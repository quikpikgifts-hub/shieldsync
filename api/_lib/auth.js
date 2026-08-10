// Shared Supabase Auth (GoTrue) REST client for the Vercel Edge runtime.
// No SDK dependency — same convention as api/_lib/supabase.js. Reuses the
// existing NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY server-side
// credentials instead of requiring a new anon-key env var: the service-role
// key is sent as the `apikey` gateway header (which only selects the
// Supabase project), while each call's actual identity comes from either
// the request body (signup/signin — public endpoints) or the caller's own
// access token (getUser/signOut — passed explicitly, never the service key).

const PLACEHOLDERS = ["YOUR-PROJECT", "your Supabase", "(your ", "REPLACE_WITH"];
const isPlaceholder = (v) => PLACEHOLDERS.some((p) => v.includes(p));

function credentials() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/^=+/, "").trim();
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").replace(/^=+/, "").trim();
  if (!url || !key) return { creds: null, reason: "missing" };
  if (isPlaceholder(url) || isPlaceholder(key)) return { creds: null, reason: "placeholder" };
  return { creds: { url, key }, reason: null };
}

async function goTrue(path, { method = "POST", body, accessToken } = {}) {
  const { creds, reason } = credentials();
  if (!creds) {
    return { ok: false, status: 503, data: { error: reason === "placeholder" ? "Auth not configured (placeholder credentials)" : "Auth not configured" } };
  }
  const r = await fetch(`${creds.url}/auth/v1${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      apikey: creds.key,
      Authorization: `Bearer ${accessToken || creds.key}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, data };
}

export async function signUp(email, password) {
  return goTrue("/signup", { body: { email, password } });
}

export async function signInWithPassword(email, password) {
  return goTrue("/token?grant_type=password", { body: { email, password } });
}

export async function refreshSession(refreshToken) {
  return goTrue("/token?grant_type=refresh_token", { body: { refresh_token: refreshToken } });
}

// Requires the caller's own access token — never falls back to the service
// key, since that would identify the service account, not a real user.
export async function getUser(accessToken) {
  if (!accessToken) return { ok: false, status: 401, data: { error: "missing token" } };
  return goTrue("/user", { method: "GET", accessToken });
}

export async function signOut(accessToken) {
  if (!accessToken) return { ok: true, status: 204, data: {} };
  return goTrue("/logout", { accessToken });
}

// Extracts "Bearer <token>" from a Request's Authorization header.
export function bearerToken(req) {
  const auth = req.headers.get("authorization") || "";
  return auth.startsWith("Bearer ") ? auth.slice(7) : null;
}
