export const config = { runtime: "edge" };

// One-shot diagnostic — submit a realistic test booking to verify
// the full /api/book supabase insert path end-to-end.
// Safe to remove after confirmed working.

export default async function handler(req) {
  const cleanEnv = v => (v || "").replace(/^=+/, "").trim();
  const supabaseUrl = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const supabaseKey = cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (!supabaseUrl || !supabaseKey) {
    return new Response(JSON.stringify({ error: "env vars missing" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const bookingId = `bkg_${Date.now()}_test01`;
  const payload = {
    booking_id: bookingId,
    lead_id:    null,
    name:       "Marcus Rivera",
    business:   "Rivera Security Solutions",
    email:      "marcus.rivera@riverasecurity.com",
    phone:      "(407) 555-0192",
    status:     "confirmed",
    notes:      "Test booking — submitted via /api/testbook diagnostic endpoint",
  };

  let insertResult;
  try {
    const r = await fetch(`${supabaseUrl}/rest/v1/bookings`, {
      method: "POST",
      headers: {
        "Content-Type":  "application/json",
        "apikey":        supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Prefer":        "return=representation",
      },
      body: JSON.stringify(payload),
    });
    const body = await r.text().catch(() => "");
    insertResult = { http_status: r.status, ok: r.ok, body };
  } catch (err) {
    insertResult = { ok: false, error: err?.message || String(err) };
  }

  // Immediately read back the row to confirm persistence
  let readBack;
  try {
    const r2 = await fetch(
      `${supabaseUrl}/rest/v1/bookings?booking_id=eq.${bookingId}&select=*`,
      {
        headers: {
          "apikey":        supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
          "Accept":        "application/json",
        },
      }
    );
    const body2 = await r2.text().catch(() => "");
    readBack = { http_status: r2.status, ok: r2.ok, body: body2 };
  } catch (err) {
    readBack = { ok: false, error: err?.message || String(err) };
  }

  return new Response(
    JSON.stringify({ timestamp: new Date().toISOString(), payload, insertResult, readBack }, null, 2),
    { status: 200, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
  );
}
