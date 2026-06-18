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

  const { leadId, name, email, biz } = body;
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

  await kv("LPUSH", "veridian:bookings", JSON.stringify(booking));
  if (leadId) await kv("SET", `veridian:booked:${leadId}`, "1");

  if (!resendKey) {
    console.error("[book] RESEND_API_KEY is missing — no emails will be sent");
  } else {
    await Promise.allSettled([
      sendEmail(resendKey, {
        from: `Veridian <noreply@${fromDomain}>`,
        to: [toEmail],
        subject: `Consultation Booked: ${name || "Unknown"} — ${biz || "Unknown Business"}`,
        text: `CONSULTATION BOOKED\nBooking ID: ${bookingId}\nLead ID: ${leadId || "direct"}\n\nClient: ${name || "Unknown"}\nBusiness: ${biz || "(not provided)"}\nEmail: ${email}\n\nAction: Client booked via external calendar. Send prep notes to ${email}.`,
      }, "team-booking"),

      sendEmail(resendKey, {
        from: `Veridian <hello@${fromDomain}>`,
        to: [email],
        reply_to: toEmail,
        subject: `Consultation Confirmed — We'll See You Soon`,
        text: `Hi ${firstName},\n\nYou're confirmed. We've received your booking and we're looking forward to speaking with you.\n\nIn the meantime, if you have any questions or need to reschedule, just reply to this email.\n\nSee you soon,\n— The Veridian Team\n${toEmail}`,
      }, "client-confirm"),
    ]);
  }

  console.log(`[book] done — bookingId=${bookingId}`);

  return new Response(JSON.stringify({ success: true, bookingId }), {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}
