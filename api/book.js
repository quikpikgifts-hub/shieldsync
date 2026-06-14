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

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { leadId, slot, name, email, biz } = body;
  if (!slot || !email) {
    return new Response(JSON.stringify({ error: "Slot and email required." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const bookingId = mkId();
  const ts = new Date().toISOString();
  const firstName = (name || "").split(" ")[0] || "there";
  const booking = { bookingId, leadId, slot, name, email, biz, timestamp: ts };

  await kv("LPUSH", "veridian:bookings", JSON.stringify(booking));
  if (leadId) await kv("SET", `veridian:booked:${leadId}`, "1");

  const resendKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.TEAM_EMAIL || "hello@veridian.io";
  const fromDomain = process.env.FROM_DOMAIN || "veridian.io";

  if (resendKey) {
    try {
      await Promise.all([
        fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: `Veridian <noreply@${fromDomain}>`,
            to: [toEmail],
            subject: `Appointment Booked: ${name || "Unknown"} — ${slot.date} at ${slot.time}`,
            text: `APPOINTMENT BOOKED\nBooking ID: ${bookingId}\nLead ID: ${leadId || "direct"}\n\nClient: ${name || "Unknown"}\nBusiness: ${biz || "(not provided)"}\nEmail: ${email}\n\nSlot: ${slot.date} at ${slot.time} (30 minutes)\n\nAction: Send calendar invite and prep notes to ${email}.`,
          }),
        }),
        fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: `Veridian <hello@${fromDomain}>`,
            to: [email],
            reply_to: toEmail,
            subject: `Consultation Confirmed — ${slot.date} at ${slot.time}`,
            text: `Hi ${firstName},\n\nYour free consultation is confirmed.\n\nDate: ${slot.date}\nTime: ${slot.time}\nDuration: 30 minutes\n\nWe'll send a calendar invite and prep notes shortly. If you need to reschedule, just reply to this email.\n\nSee you then,\n— The Veridian Team\n${toEmail}`,
          }),
        }),
      ]);
    } catch {}
  }

  return new Response(JSON.stringify({ success: true, bookingId }), {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}
