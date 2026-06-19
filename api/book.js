export const config = { runtime: "edge" };

async function kv(cmd, ...args) {
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

function mkId() {
  return `bkg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

async function supabaseInsert(row) {
  const PLACEHOLDERS = ["YOUR-PROJECT", "your Supabase", "(your ", "REPLACE_WITH"];
  const isPlaceholder = v => PLACEHOLDERS.some(p => v.includes(p));

  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const url = rawUrl.replace(/^=+/, "").trim();
  const key = rawKey.replace(/^=+/, "").trim();

  console.log("[book/supabase] NEXT_PUBLIC_SUPABASE_URL exists:", !!url, "| preview:", url ? url.slice(0, 60) : "EMPTY");
  console.log("[book/supabase] SUPABASE_SERVICE_ROLE_KEY exists:", !!key, "| prefix:", key ? key.slice(0, 20) + "..." : "EMPTY");

  if (!url || !key) {
    console.error("[book/supabase] ABORT — env vars missing");
    return { skipped: true };
  }
  if (isPlaceholder(url) || isPlaceholder(key)) {
    console.error("[book/supabase] ABORT — env vars contain placeholder values");
    return { skipped: true, reason: "placeholder" };
  }

  const endpoint = `${url}/rest/v1/bookings`;
  console.log("[book/supabase] Exact URL:", endpoint);
  console.log("[book/supabase] Payload:", JSON.stringify(row));

  const r = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": key,
      "Authorization": `Bearer ${key}`,
      "Prefer": "return=representation",
    },
    body: JSON.stringify(row),
  });

  const responseText = await r.text().catch(() => "");
  console.log("[book/supabase] HTTP status:", r.status);
  console.log("[book/supabase] Response body:", responseText || "(empty)");

  if (!r.ok) {
    console.error("[book/supabase] INSERT FAILED — HTTP", r.status);
    throw new Error(responseText);
  }

  console.log("[book/supabase] INSERT OK");
  return { ok: true, status: r.status, body: responseText };
}

async function sendEmail(apiKey, payload, label) {
  console.log(`[book] send: ${label} → to=${JSON.stringify(payload.to)} from=${payload.from}`);
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      console.error(`[book] RESEND FAIL: ${label} — HTTP ${r.status} —`, JSON.stringify(data));
    } else {
      console.log(`[book] RESEND OK: ${label} — id=${data.id}`);
    }
    return { ok: r.ok, status: r.status, data };
  } catch (err) {
    console.error(`[book] RESEND ERROR: ${label} —`, err?.message || String(err));
    return { ok: false, error: err?.message };
  }
}

export default async function handler(req) {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const cleanEnv = v => (v || "").replace(/^=+/, "").trim();
  const resendKey  = process.env.RESEND_API_KEY;
  const toEmail    = cleanEnv(process.env.TEAM_EMAIL)   || "info@veridianriskgroup.org";
  const fromDomain = cleanEnv(process.env.FROM_DOMAIN)  || "veridianriskgroup.org";

  console.log("[book] ENV:", {
    RESEND_API_KEY:  resendKey ? `set (${resendKey.slice(0,6)}…)` : "MISSING",
    FROM_DOMAIN:     process.env.FROM_DOMAIN  || "NOT SET — using default: veridianriskgroup.org",
    TEAM_EMAIL:      process.env.TEAM_EMAIL   || "NOT SET — using default: info@veridianriskgroup.org",
  });

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { leadId, name, email, biz, phone, notes } = body;
  if (!email) {
    return new Response(JSON.stringify({ error: "Email required." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const bookingId = mkId();
  const ts = new Date().toISOString();
  const firstName = (name || "").split(" ")[0] || "there";
  const booking = { bookingId, leadId, name, email, biz, timestamp: ts };

  console.log(`[book] new booking: ${bookingId} — ${name} | ${email}`);

  // Supabase insert — before emails, errors are non-fatal
  const sbPayload = {
    booking_id: bookingId,
    lead_id:    leadId || null,
    name:       name || null,
    business:   biz || null,
    email:      email,
    phone:      phone || null,
    status:     "confirmed",
    notes:      notes || null,
  };
  console.log("[book] supabase payload:", JSON.stringify(sbPayload));

  let sbResult = { skipped: true };
  try {
    sbResult = await supabaseInsert(sbPayload);
  } catch (err) {
    sbResult = { ok: false, error: err.message };
    console.error("[book] supabase insert threw:", err.message);
  }
  const bookingInserted = sbResult?.ok === true;
  console.log("[book] supabase result:", JSON.stringify(sbResult));
  console.log("[book] bookingInserted:", bookingInserted);

  await kv("LPUSH", "veridian:bookings", JSON.stringify(booking));
  if (leadId) await kv("SET", `veridian:booked:${leadId}`, "1");

  if (!resendKey) {
    console.error("[book] RESEND_API_KEY is missing — no emails will be sent");
  } else {
    const teamText = [
      `CONSULTATION BOOKED`,
      `Booking ID: ${bookingId}`,
      `Lead ID:    ${leadId || "direct (no lead ID)"}`,
      `Time:       ${ts}`,
      ``,
      `CLIENT`,
      `Name:     ${name || "(not provided)"}`,
      `Business: ${biz  || "(not provided)"}`,
      `Email:    ${email}`,
      ``,
      `Action: Client booked via external calendar. Confirm calendar invite and send prep notes to ${email}.`,
    ].join("\n");

    const clientText = [
      `Hi ${firstName},`,
      ``,
      `Thank you for scheduling your consultation with Veridian.`,
      ``,
      `Your booking has been received and confirmed.`,
      ``,
      `Before the consultation, please reply with:`,
      ``,
      `• Business website`,
      `• Approximate monthly call volume`,
      `• Current lead handling process`,
      `• Primary revenue challenge`,
      ``,
      `We will review your information and prepare recommendations before the meeting.`,
      ``,
      `Booking ID: ${bookingId}`,
      leadId ? `Lead ID: ${leadId}` : null,
      ``,
      `Thank you,`,
      ``,
      `Veridian Risk Group`,
      `info@veridianriskgroup.org`,
    ].filter(line => line !== null).join("\n");

    const [teamResult, clientResult] = await Promise.allSettled([
      sendEmail(resendKey, {
        from: `Veridian <noreply@${fromDomain}>`,
        to: [toEmail],
        subject: `Consultation Booked: ${name || "Unknown"} — ${biz || "Unknown Business"}`,
        text: teamText,
      }, "team-booking"),

      sendEmail(resendKey, {
        from: `Veridian <hello@${fromDomain}>`,
        to: [email],
        reply_to: toEmail,
        subject: `Your Veridian Consultation is Confirmed`,
        text: clientText,
      }, "client-confirm"),
    ]);

    console.log("[book] team-booking:", teamResult.status, teamResult.value?.ok ?? teamResult.reason?.message);
    console.log("[book] client-confirm:", clientResult.status, clientResult.value?.ok ?? clientResult.reason?.message);
  }

  console.log(`[book] done — bookingId=${bookingId}`);

  return new Response(JSON.stringify({
    success: true,
    bookingId,
    bookingInserted,
    bookingStatus: sbResult?.status ?? null,
    bookingBody:   sbResult?.body ?? sbResult?.error ?? null,
  }), {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}
