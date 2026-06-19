export const config = { runtime: "edge" };

const PLACEHOLDERS = ["YOUR-PROJECT", "your Supabase", "(your ", "REPLACE_WITH", "example.com"];
const isPlaceholder = v => PLACEHOLDERS.some(p => v.includes(p));

async function probeTable(url, key, table) {
  try {
    const r = await fetch(`${url}/rest/v1/${table}?select=*&limit=0`, {
      headers: {
        "apikey": key,
        "Authorization": `Bearer ${key}`,
        "Accept": "application/json",
      },
    });
    const body = await r.text().catch(() => "");
    return { ok: r.ok, status: r.status, body: body || "(empty)" };
  } catch (err) {
    return { ok: false, error: err?.message || String(err) };
  }
}

export default async function handler(req) {
  const cleanEnv = v => (v || "").replace(/^=+/, "").trim();

  const supabaseUrl = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const supabaseKey = cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY);
  const resendKey   = (process.env.RESEND_API_KEY || "").trim();
  const teamEmail   = cleanEnv(process.env.TEAM_EMAIL)  || "info@veridianriskgroup.org (default)";
  const fromDomain  = cleanEnv(process.env.FROM_DOMAIN) || "veridianriskgroup.org (default)";

  const env = {
    NEXT_PUBLIC_SUPABASE_URL: {
      set: !!supabaseUrl,
      placeholder: supabaseUrl ? isPlaceholder(supabaseUrl) : false,
      preview: supabaseUrl ? supabaseUrl.slice(0, 50) : "MISSING",
    },
    SUPABASE_SERVICE_ROLE_KEY: {
      set: !!supabaseKey,
      placeholder: supabaseKey ? isPlaceholder(supabaseKey) : false,
      valid_format: supabaseKey.startsWith("eyJ"),
    },
    RESEND_API_KEY: {
      set: !!resendKey,
      placeholder: resendKey ? isPlaceholder(resendKey) : false,
      valid_format: resendKey.startsWith("re_"),
    },
    TEAM_EMAIL:  { value: teamEmail },
    FROM_DOMAIN: { value: fromDomain },
  };

  const result = { timestamp: new Date().toISOString(), env };

  const sbReady = supabaseUrl && supabaseKey
    && !isPlaceholder(supabaseUrl) && !isPlaceholder(supabaseKey);

  if (sbReady) {
    const [leads, bookings] = await Promise.all([
      probeTable(supabaseUrl, supabaseKey, "leads"),
      probeTable(supabaseUrl, supabaseKey, "bookings"),
    ]);
    result.supabase = { leads, bookings };

    // Test insert into public.bookings — safe to delete row after review
    const testRow = {
      booking_id: `health_${Date.now()}`,
      lead_id:    null,
      name:       "Health Check",
      business:   "Diagnostic",
      email:      "health@test.internal",
      phone:      null,
      status:     "confirmed",
      notes:      "inserted by /api/health — safe to delete",
    };
    try {
      const insR = await fetch(`${supabaseUrl}/rest/v1/bookings`, {
        method: "POST",
        headers: {
          "Content-Type":  "application/json",
          "apikey":        supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
          "Prefer":        "return=representation",
        },
        body: JSON.stringify(testRow),
      });
      const insBody = await insR.text().catch(() => "");
      result.bookings_insert_test = {
        payload:     testRow,
        http_status: insR.status,
        ok:          insR.ok,
        body:        insBody || "(empty)",
      };
    } catch (err) {
      result.bookings_insert_test = { error: err?.message || String(err) };
    }
  } else {
    result.supabase = {
      skipped: supabaseUrl && supabaseKey
        ? "placeholder values detected in env vars"
        : "env vars missing",
    };
  }

  result.ready = sbReady
    && result.supabase.leads?.ok
    && result.supabase.bookings?.ok
    && env.RESEND_API_KEY.set
    && env.RESEND_API_KEY.valid_format;

  return new Response(JSON.stringify(result, null, 2), {
    status: 200,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}
