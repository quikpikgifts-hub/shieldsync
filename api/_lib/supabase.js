// Shared Supabase REST client for the Vercel Edge runtime (no SDK dependency).
// Consolidates the supabaseInsert()/supabaseUpdate()/supabaseGet() copies
// previously duplicated across contact.js, book.js, voice.js, sms.js, metrics.js.

const PLACEHOLDERS = ["YOUR-PROJECT", "your Supabase", "(your ", "REPLACE_WITH"];
const isPlaceholder = (v) => PLACEHOLDERS.some((p) => v.includes(p));

function credentials() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/^=+/, "").trim();
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").replace(/^=+/, "").trim();
  if (!url || !key) return { creds: null, reason: "missing" };
  if (isPlaceholder(url) || isPlaceholder(key)) return { creds: null, reason: "placeholder" };
  return { creds: { url, key }, reason: null };
}

export async function supabaseInsert(table, row, { returnRepresentation = false } = {}) {
  const { creds, reason } = credentials();
  if (!creds) {
    if (reason === "placeholder") console.error(`[supabase] ABORT insert ${table} — env vars contain placeholder values`);
    return { skipped: true, reason };
  }
  const r = await fetch(`${creds.url}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: creds.key,
      Authorization: `Bearer ${creds.key}`,
      Prefer: returnRepresentation ? "return=representation" : "return=minimal",
    },
    body: JSON.stringify(row),
  });
  const responseText = await r.text().catch(() => "");
  if (!r.ok) {
    console.error(`[supabase] INSERT ${table} FAILED — HTTP`, r.status);
    throw new Error(responseText);
  }
  return { ok: true, status: r.status, body: responseText };
}

export async function supabaseUpdate(table, filter, data) {
  const { creds } = credentials();
  if (!creds) return { skipped: true };
  try {
    await fetch(`${creds.url}/rest/v1/${table}?${filter}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        apikey: creds.key,
        Authorization: `Bearer ${creds.key}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify(data),
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

export async function supabaseSelect(table, query) {
  const { creds } = credentials();
  if (!creds) return null;
  try {
    const r = await fetch(`${creds.url}/rest/v1/${table}?${query}`, {
      headers: { apikey: creds.key, Authorization: `Bearer ${creds.key}`, Accept: "application/json" },
    });
    if (!r.ok) return null;
    return await r.json().catch(() => null);
  } catch {
    return null;
  }
}
