export const config = { runtime: "edge" };

async function sendEmail(apiKey, payload, label) {
  console.log(`[assessment] send: ${label} → to=${JSON.stringify(payload.to)} from=${payload.from}`);
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      console.error(`[assessment] RESEND FAIL: ${label} — HTTP ${r.status} —`, JSON.stringify(data));
    } else {
      console.log(`[assessment] RESEND OK: ${label} — id=${data.id}`);
    }
    return { ok: r.ok, status: r.status, data };
  } catch (err) {
    console.error(`[assessment] RESEND ERROR: ${label} —`, err?.message || String(err));
    return { ok: false, error: err?.message };
  }
}

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

function mkId() {
  return `asmnt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

const REC_LABELS = {
  revenue: "Missed Call Recovery",
  followup: "Follow-Up Automation",
  continuity: "Always-Available Coverage",
  compliance: "Compliance Programs",
  risk: "Business Continuity Planning",
};

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
  try { body = await req.json(); } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400, headers: { "Content-Type": "application/json" },
    });
  }

  const { email, name, overallPct, level, areaScores, recommendations } = body;
  if (!email?.trim()) {
    return new Response(JSON.stringify({ error: "Email required" }), {
      status: 400, headers: { "Content-Type": "application/json" },
    });
  }

  const assessmentId = mkId();
  const ts = new Date().toISOString();
  const firstName = (name || "").trim().split(" ")[0] || "there";
  const resendKey  = process.env.RESEND_API_KEY;
  const toEmail    = process.env.TEAM_EMAIL   || "info@veridianrisk.com";
  const fromDomain = process.env.FROM_DOMAIN  || "veridianrisk.com";
  const bookingUrl = process.env.BOOKING_URL  || `https://${fromDomain}/#contact`;

  console.log("[assessment] ENV:", {
    RESEND_API_KEY: resendKey ? `set (${resendKey.slice(0,6)}…)` : "MISSING",
    FROM_DOMAIN:    process.env.FROM_DOMAIN  || "NOT SET — using default: veridianrisk.com",
    TEAM_EMAIL:     process.env.TEAM_EMAIL   || "NOT SET — using default: info@veridianrisk.com",
    KV_REST_API_URL: process.env.KV_REST_API_URL ? "set" : "MISSING",
  });

  const priority = (overallPct || 100) < 40 ? "HOT" : (overallPct || 100) < 60 ? "HIGH" : (overallPct || 100) < 80 ? "MEDIUM" : "LOW";
  console.log(`[assessment] id=${assessmentId} | score=${overallPct} | priority=${priority} | from=${email.trim()}`);

  const areaBlock = (areaScores || []).map(a => `${a.label}: ${a.pct}%`).join("\n");
  const recBlock = (recommendations || []).slice(0, 3).map((id, i) => `${i + 1}. ${REC_LABELS[id] || id}`).join("\n");

  const leadRecord = {
    leadId: assessmentId,
    timestamp: ts,
    source: "assessment",
    priority,
    followUpTrigger: true,
    contact: { name: name?.trim() || "", email: email.trim(), phone: "", business: "" },
    challenge: `Assessment score: ${overallPct}/100 (${level || "—"})`,
    calcData: null,
    recoveryEstimate: null,
  };

  const assessmentRecord = {
    assessmentId, ts, email: email.trim(), name: name?.trim() || "",
    overallPct, level, areaScores, recommendations, priority,
  };

  const teamText = `ASSESSMENT COMPLETED — ${priority} PRIORITY\nID: ${assessmentId}\nTime: ${ts}\n\nCONTACT\nName:  ${name?.trim() || "(not provided)"}\nEmail: ${email.trim()}\n\nSCORE: ${overallPct}/100 — ${level}\n\nBREAKDOWN\n${areaBlock}\n\nRECOMMENDATIONS\n${recBlock}\n\nAction: Follow up within ${priority === "HOT" ? "2 hours" : priority === "HIGH" ? "4 hours" : "1 business day"}.`;

  const clientText = `Hi ${firstName},\n\nThank you for completing the Veridian Business Readiness Assessment.\n\nYOUR SCORE: ${overallPct}/100 — ${level}\n\nBREAKDOWN BY AREA\n${areaBlock}\n\nTOP RECOMMENDATIONS FOR YOUR BUSINESS\n${recBlock}\n\nNEXT STEP\nBook a free 30-minute consultation. We'll review your assessment results and build a specific action plan tailored to your situation.\n\n${bookingUrl}\n\nNo obligation. We'll come prepared with your numbers.\n\n— The Veridian Team\n${toEmail}`;

  if (!resendKey) {
    console.error("[assessment] RESEND_API_KEY is missing — no emails will be sent");
  }

  await Promise.allSettled([
    kv("SET", `veridian:assessment:${assessmentId}`, JSON.stringify(assessmentRecord)),
    kv("LPUSH", "veridian:assessments", JSON.stringify(assessmentRecord)),
    kv("SET", `veridian:lead:${assessmentId}`, JSON.stringify(leadRecord)),
    kv("LPUSH", "veridian:leads", JSON.stringify(leadRecord)),
    kv("ZADD", "veridian:fu:24h", String(Date.now() + 86400000), assessmentId),
    kv("ZADD", "veridian:fu:3d", String(Date.now() + 259200000), assessmentId),
    resendKey
      ? sendEmail(resendKey, {
          from: `Veridian <noreply@${fromDomain}>`,
          to: [toEmail],
          subject: `[${priority}] Assessment: ${name?.trim() || email.trim()} — ${overallPct}/100`,
          text: teamText,
        }, "team-alert")
      : null,
    resendKey
      ? sendEmail(resendKey, {
          from: `Veridian <hello@${fromDomain}>`,
          to: [email.trim()],
          reply_to: toEmail,
          subject: `Your Business Readiness Assessment — Score: ${overallPct}/100`,
          text: clientText,
        }, "client-results")
      : null,
  ]);

  console.log(`[assessment] done — assessmentId=${assessmentId} priority=${priority}`);

  return new Response(JSON.stringify({ success: true, assessmentId, priority }), {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}
