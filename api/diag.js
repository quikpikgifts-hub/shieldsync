export const config = { runtime: "edge" };

export default async function handler(req) {
  const result = {};

  // 1. Env var check
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const url    = rawUrl.replace(/^=+/, "").trim();
  const key    = rawKey.replace(/^=+/, "").trim();

  result.env = {
    NEXT_PUBLIC_SUPABASE_URL: {
      raw_length:     rawUrl.length,
      cleaned_length: url.length,
      present:        !!url,
      preview:        url ? url.slice(0, 60) : "MISSING",
    },
    SUPABASE_SERVICE_ROLE_KEY: {
      raw_length:     rawKey.length,
      cleaned_length: key.length,
      present:        !!key,
      prefix:         key ? key.slice(0, 20) + "..." : "MISSING",
    },
  };

  if (!url || !key) {
    return new Response(JSON.stringify({ ...result, abort: "missing env vars" }, null, 2), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  // 2. Schema probe — does the table exist and can service_role read it?
  try {
    const probeRes = await fetch(`${url}/rest/v1/leads?select=*&limit=0`, {
      headers: {
        "apikey": key,
        "Authorization": `Bearer ${key}`,
        "Accept": "application/json",
      },
    });
    const probeBody = await probeRes.text().catch(() => "");
    const probeHeaders = {};
    probeRes.headers.forEach((v, k) => { probeHeaders[k] = v; });
    result.schema_probe = {
      http_status: probeRes.status,
      body:        probeBody || "(empty)",
      headers:     probeHeaders,
    };
  } catch (err) {
    result.schema_probe = { error: err?.message || String(err) };
  }

  // 3. Insert test row
  const testRow = {
    lead_id:   `diag_${Date.now()}`,
    name:      "Diagnostic Test",
    business:  "Diag Co",
    email:     "diag@test.internal",
    phone:     "000-0000",
    challenge: "automated diagnostic insert",
    priority:  "LOW",
    status:    "new",
    notes:     "inserted by /api/diag — safe to delete",
  };

  result.insert_payload = testRow;

  try {
    const insRes = await fetch(`${url}/rest/v1/leads`, {
      method: "POST",
      headers: {
        "Content-Type":  "application/json",
        "apikey":        key,
        "Authorization": `Bearer ${key}`,
        "Prefer":        "return=representation",
      },
      body: JSON.stringify(testRow),
    });
    const insBody = await insRes.text().catch(() => "");
    result.insert = {
      http_status: insRes.status,
      ok:          insRes.ok,
      body:        insBody || "(empty)",
    };
  } catch (err) {
    result.insert = { error: err?.message || String(err) };
  }

  return new Response(JSON.stringify(result, null, 2), {
    status: 200,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}
