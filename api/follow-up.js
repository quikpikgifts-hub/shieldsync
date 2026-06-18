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
  return (await r.json()).result;
}

function fmtAnnual(n) {
  if (!n || n === 0) return null;
  return n >= 1000 ? `$${(n / 1000).toFixed(1)}K` : `$${n}`;
}

// Follow-up email templates — each returns {subject, text}
function template(sequence, lead) {
  const { contact, calcData, recoveryEstimate } = lead;
  const name = contact?.name?.split(" ")[0] || "there";
  const biz = contact?.business || "your business";
  const email = contact?.email || "";
  const annual = recoveryEstimate || (calcData?.annualPotential ? fmtAnnual(calcData.annualPotential) : null);
  const lostMo = calcData?.lostMonthly ? `$${calcData.lostMonthly.toLocaleString()}` : null;
  const recMo = calcData?.recoveryMonthly ? `$${calcData.recoveryMonthly.toLocaleString()}` : null;
  const missRate = calcData?.miss ? `${calcData.miss}%` : null;
  const toEmail = process.env.TEAM_EMAIL || "info@veridianriskgroup.org";

  const ctaLine = `Book your free 30-minute consultation: ${process.env.BOOKING_URL || `https://${process.env.FROM_DOMAIN || "veridianriskgroup.org"}/#contact`}`;

  if (sequence === "24h") {
    const estLine = annual ? `${annual}/yr` : "a significant amount";
    return {
      subject: annual ? `About the ${estLine} you calculated, ${name}` : `Following up on your Veridian inquiry`,
      text: `Hi ${name},

Yesterday you reached out to Veridian${annual ? ` and calculated ${estLine} in recoverable revenue` : ""}.

We haven't connected yet — and we don't want your inquiry to fall through the cracks.

${lostMo ? `At your current miss rate${missRate ? ` (${missRate})` : ""}, you're losing ${lostMo}/month to unanswered calls. With Veridian, the average recovery is 68% of that${recMo ? ` — about ${recMo}/month` : ""}.` : "Every missed call is revenue walking out the door. Veridian stops that."}

Is this week a good time to connect? 30 minutes, no pitch — just your numbers.

${ctaLine}

— The Veridian Team
${toEmail}`,
    };
  }

  if (sequence === "3d") {
    return {
      subject: `Quick question about ${biz}, ${name}`,
      text: `Hi ${name},

We reviewed the numbers from ${biz}.

${calcData ? `Here's what stands out:\n- ${calcData.missed || "?"} calls missed every month\n- ${lostMo ? `${lostMo} in potential revenue going unanswered` : "Revenue left on the table"}\n- 68% of that is recoverable with the right system` : "The opportunity cost of missed calls adds up fast — and most service businesses don't realize how much until they calculate it."}

We've helped businesses in your space close that gap without hiring additional staff.

If you're curious what that would look like specifically for ${biz}, a 30-minute call is all it takes.

${ctaLine}

If the timing isn't right, just let us know.

— The Veridian Team
${toEmail}`,
    };
  }

  if (sequence === "7d") {
    return {
      subject: `What businesses like ${biz} see with Veridian`,
      text: `Hi ${name},

One week ago you calculated ${annual ? `${annual}/yr in recoverable revenue` : "how much revenue you're losing to missed calls"}.

Here's what typically happens 90 days after a business like yours starts working with Veridian:

✓ Every missed call gets a response in under 60 seconds — automatically
✓ Inquiries are qualified without staff involvement
✓ Appointments book directly to your calendar
✓ No-shows drop significantly with automated reminders
✓ Monthly revenue from recovered calls becomes predictable

None of this requires new staff, new phone systems, or new software to learn.

If this is still relevant to you, I'd like to schedule a call this week.

${ctaLine}

— The Veridian Team
${toEmail}`,
    };
  }

  if (sequence === "14d") {
    return {
      subject: `Closing your file, ${name}`,
      text: `Hi ${name},

This will be my last reach out.

Two weeks ago, you ${annual ? `calculated ${annual}/yr in recoverable revenue from missed calls` : "inquired about Veridian's revenue recovery service"}. I don't know if the timing was off, if you found another solution, or if this just isn't the right fit — any of those is completely fine.

If you ever reach a point where missed calls and lost follow-up become a real business problem, we'll be here.

And if you'd like a quick 15-minute conversation — even just to understand your options — I'm happy to make time.

${ctaLine}

Wishing you and ${biz} all the best.

— The Veridian Team
${toEmail}`,
    };
  }

  return null;
}

function checkAuth(req) {
  const auth = req.headers.get("authorization") || "";
  const pin = auth.startsWith("Bearer ") ? auth.slice(7) : new URL(req.url).searchParams.get("pin") || "";
  // Follow-up processor uses CRON_SECRET; dashboard uses DASH_PIN
  const cronSecret = process.env.CRON_SECRET;
  const dashPin = process.env.DASH_PIN || "0000";
  return pin === dashPin || (cronSecret && pin === cronSecret);
}

async function processSequence(sequence, resendKey, fromDomain) {
  const now = Date.now();
  const due = await kv("ZRANGEBYSCORE", `veridian:fu:${sequence}`, "0", String(now));
  if (!due || !due.length) return { processed: 0, sequence };

  let sent = 0;
  for (const leadId of due) {
    try {
      const raw = await kv("GET", `veridian:lead:${leadId}`);
      if (!raw) { await kv("ZREM", `veridian:fu:${sequence}`, leadId); continue; }

      const lead = JSON.parse(raw);
      if (!lead.contact?.email) { await kv("ZREM", `veridian:fu:${sequence}`, leadId); continue; }

      // Skip if already unsubscribed
      const unsub = await kv("EXISTS", `veridian:unsub:${lead.contact.email}`);
      if (Number(unsub) > 0) { await kv("ZREM", `veridian:fu:${sequence}`, leadId); continue; }

      const tmpl = template(sequence, lead);
      if (!tmpl) { await kv("ZREM", `veridian:fu:${sequence}`, leadId); continue; }

      if (resendKey) {
        const toEmail = process.env.TEAM_EMAIL || "info@veridianriskgroup.org";
        const r = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: `Veridian <hello@${fromDomain}>`,
            to: [lead.contact.email],
            reply_to: toEmail,
            subject: tmpl.subject,
            text: tmpl.text,
          }),
        });
        if (r.ok) {
          sent++;
          // Log to KV
          await kv("LPUSH", `veridian:fu-log:${leadId}`, JSON.stringify({ sequence, ts: new Date().toISOString(), email: lead.contact.email }));
        }
      } else {
        // No Resend — still log that we would have sent
        await kv("LPUSH", `veridian:fu-log:${leadId}`, JSON.stringify({ sequence, ts: new Date().toISOString(), skipped: "no-resend-key" }));
        sent++;
      }

      await kv("ZREM", `veridian:fu:${sequence}`, leadId);
    } catch { await kv("ZREM", `veridian:fu:${sequence}`, leadId); }
  }

  return { processed: sent, total: due.length, sequence };
}

export default async function handler(req) {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  if (!checkAuth(req)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { "Content-Type": "application/json" },
    });
  }

  const resendKey = process.env.RESEND_API_KEY;
  const fromDomain = process.env.FROM_DOMAIN || "veridianriskgroup.org";

  if (req.method === "GET") {
    // Vercel Cron sends Authorization: Bearer {CRON_SECRET}
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = req.headers.get("authorization") || "";
    const isCron = cronSecret && authHeader === `Bearer ${cronSecret}`;

    if (isCron) {
      // Process all due follow-ups (called by Vercel Cron at 0 9 * * *)
      const results = await Promise.all(
        ["24h", "3d", "7d", "14d"].map(s => processSequence(s, resendKey, fromDomain))
      );
      const total = results.reduce((s, r) => s + r.processed, 0);
      return new Response(JSON.stringify({ success: true, sent: total, results }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Dashboard stats check (PIN-gated)
    if (!checkAuth(req)) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { "Content-Type": "application/json" },
      });
    }

    // Status check — how many leads are queued per sequence
    const sequences = ["24h", "3d", "7d", "14d"];
    const stats = await Promise.all(sequences.map(async s => {
      const count = await kv("ZCARD", `veridian:fu:${s}`);
      const due = await kv("ZCOUNT", `veridian:fu:${s}`, "0", String(Date.now()));
      return { sequence: s, queued: Number(count) || 0, due: Number(due) || 0 };
    }));
    return new Response(JSON.stringify({ stats, resendConfigured: !!resendKey }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  if (req.method === "POST") {
    let body;
    try { body = await req.json(); } catch { body = {}; }

    const { action, leadId, sequence } = body;

    // Manual send to a specific lead
    if (action === "send" && leadId && sequence) {
      const raw = await kv("GET", `veridian:lead:${leadId}`);
      if (!raw) return new Response(JSON.stringify({ error: "Lead not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
      const lead = JSON.parse(raw);
      const tmpl = template(sequence, lead);
      if (!tmpl) return new Response(JSON.stringify({ error: "Unknown sequence" }), { status: 400, headers: { "Content-Type": "application/json" } });

      if (resendKey) {
        const toEmail = process.env.TEAM_EMAIL || "info@veridianriskgroup.org";
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: `Veridian <hello@${fromDomain}>`,
            to: [lead.contact.email],
            reply_to: toEmail,
            subject: tmpl.subject,
            text: tmpl.text,
          }),
        });
      }
      await kv("LPUSH", `veridian:fu-log:${leadId}`, JSON.stringify({ sequence, ts: new Date().toISOString(), manual: true }));
      return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
    }

    // Cron processor — process all due follow-ups
    if (action === "process" || !action) {
      const results = await Promise.all(
        ["24h", "3d", "7d", "14d"].map(s => processSequence(s, resendKey, fromDomain))
      );
      const total = results.reduce((s, r) => s + r.processed, 0);
      return new Response(JSON.stringify({ success: true, sent: total, results }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  return new Response("Method not allowed", { status: 405 });
}
