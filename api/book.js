export const config = { runtime: "edge" };

import { kv, kvRateLimit } from "./_lib/kv.js";
import { cleanEnv, sendEmail } from "./_lib/email.js";
import { mkId } from "./_lib/ids.js";
import { supabaseInsert, supabaseUpdate, supabaseSelect } from "./_lib/supabase.js";

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

  if (await kvRateLimit(req, { prefix: "book", max: 5, windowSec: 3600 })) {
    return new Response(JSON.stringify({ error: "Too many requests. Please try again later." }), {
      status: 429,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  const resendKey  = process.env.RESEND_API_KEY;
  const toEmail    = cleanEnv(process.env.TEAM_EMAIL)   || "info@veridianriskgroup.org";
  const fromDomain = cleanEnv(process.env.FROM_DOMAIN)  || "veridianriskgroup.org";

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
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return new Response(JSON.stringify({ error: "Valid email required." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Duplicate booking guard — one booking per leadId
  if (leadId) {
    const existing = await supabaseSelect("bookings", `lead_id=eq.${encodeURIComponent(leadId)}&select=booking_id&limit=1`);
    if (Array.isArray(existing) && existing.length > 0) {
      const existingId = existing[0].booking_id;
      console.log(`[book] duplicate blocked — leadId=${leadId} already has bookingId=${existingId}`);
      return new Response(JSON.stringify({ success: true, bookingId: existingId, duplicate: true }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }
  }

  const bookingId = mkId("bkg");
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
  let sbResult = { skipped: true };
  try {
    sbResult = await supabaseInsert("bookings", sbPayload);
  } catch (err) {
    sbResult = { ok: false, error: err.message };
    console.error("[book] supabase insert threw:", err.message);
  }
  const bookingInserted = sbResult?.ok === true;

  await kv("LPUSH", "veridian:bookings", JSON.stringify(booking));
  if (leadId) {
    await kv("SET", `veridian:booked:${leadId}`, "1");
    // Remove from all follow-up queues — they've booked
    await Promise.all(["24h", "3d", "7d", "14d"].map(s =>
      kv("ZREM", `veridian:fu:${s}`, leadId)
    ));
    // Update lead status in Supabase
    await supabaseUpdate("leads", `lead_id=eq.${encodeURIComponent(leadId)}`, { status: "consultation_booked" });
  }

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
      }, "team-booking", "book"),

      sendEmail(resendKey, {
        from: `Veridian <hello@${fromDomain}>`,
        to: [email],
        reply_to: toEmail,
        subject: `Your Veridian Consultation is Confirmed`,
        text: clientText,
      }, "client-confirm", "book"),
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
