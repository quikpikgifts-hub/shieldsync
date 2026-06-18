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

function mkId() {
  return `vrd_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function priority(annual, challenge) {
  const urgentWords = ["urgent", "immediately", "asap", "losing", "crisis", "emergency", "now"];
  const isUrgent = urgentWords.some(w => (challenge || "").toLowerCase().includes(w));
  if (isUrgent || annual >= 200000) return "HOT";
  if (annual >= 75000) return "HIGH";
  if (annual >= 25000) return "MEDIUM";
  return "LOW";
}

function fmtAnnual(n) {
  if (!n || n === 0) return null;
  return n >= 1000 ? `$${(n / 1000).toFixed(1)}K` : `$${n}`;
}

async function sendEmail(apiKey, payload, label) {
  console.log(`[contact] send: ${label} → to=${JSON.stringify(payload.to)} from=${payload.from}`);
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      console.error(`[contact] RESEND FAIL: ${label} — HTTP ${r.status} —`, JSON.stringify(data));
    } else {
      console.log(`[contact] RESEND OK: ${label} — id=${data.id}`);
    }
    return { ok: r.ok, status: r.status, data };
  } catch (err) {
    console.error(`[contact] RESEND ERROR: ${label} —`, err?.message || String(err));
    return { ok: false, error: err?.message };
  }
}

async function ghlIntegration(crmEntry, annual, calcBlock, fmtAnnual) {
  const ghlKey = process.env.GOHIGHLEVEL_API_KEY;
  if (!ghlKey) {
    console.log("[contact] GHL: no GOHIGHLEVEL_API_KEY — skipping");
    return;
  }

  const { contact, challenge, priority: p, leadId, calcData } = crmEntry;
  const nameParts = contact.name.split(" ");

  try {
    const ghlPayload = {
      firstName: nameParts[0] || contact.name,
      lastName: nameParts.slice(1).join(" ") || "",
      email: contact.email,
      phone: contact.phone || "",
      companyName: contact.business || "",
      source: "Veridian Website",
      tags: [p, "veridian-website", ...(annual > 0 ? ["calculator-lead"] : ["direct-lead"])],
    };
    const locationId = process.env.GOHIGHLEVEL_LOCATION_ID;
    if (locationId) ghlPayload.locationId = locationId;

    const ghlRes = await fetch("https://rest.gohighlevel.com/v1/contacts/", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ghlKey}`,
        "Content-Type": "application/json",
        Version: "2021-07-28",
      },
      body: JSON.stringify(ghlPayload),
    });
    const ghlData = await ghlRes.json();
    if (!ghlRes.ok) {
      console.error(`[contact] GHL contact FAIL — HTTP ${ghlRes.status}:`, JSON.stringify(ghlData));
      return;
    }
    const contactId = ghlData.contact?.id;
    if (!contactId) {
      console.error("[contact] GHL: no contactId in response:", JSON.stringify(ghlData));
      return;
    }
    console.log(`[contact] GHL contact OK — id=${contactId}`);

    const noteText = [
      `VERIDIAN LEAD — ${p} PRIORITY`,
      `Lead ID: ${leadId}`,
      ``,
      `REVENUE CALCULATOR`,
      calcBlock,
      ``,
      `CHALLENGE`,
      challenge || "(not provided)",
      ``,
      `RECOVERY ESTIMATE: ${fmtAnnual(annual) || "Not calculated"}`,
    ].join("\n");

    await fetch(`https://rest.gohighlevel.com/v1/contacts/${contactId}/notes/`, {
      method: "POST",
      headers: { Authorization: `Bearer ${ghlKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ body: noteText }),
    });

    const pipelineId = process.env.GOHIGHLEVEL_PIPELINE_ID;
    const stageId = process.env.GOHIGHLEVEL_STAGE_ID;
    if (pipelineId && stageId && annual > 0) {
      await fetch("https://rest.gohighlevel.com/v1/opportunities/", {
        method: "POST",
        headers: { Authorization: `Bearer ${ghlKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${contact.business || contact.name} — ${fmtAnnual(annual)}/yr Recovery`,
          pipelineId,
          pipelineStageId: stageId,
          status: "open",
          monetaryValue: Math.round(annual * 0.1),
          contactId,
          source: "Veridian Website",
        }),
      });
    }
  } catch (err) {
    console.error("[contact] GHL ERROR:", err?.message || String(err));
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

  // ── Env var audit ────────────────────────────────────────────
  const resendKey  = process.env.RESEND_API_KEY;
  const fromDomain = process.env.FROM_DOMAIN || "veridianrisk.com";
  const toEmail    = process.env.TEAM_EMAIL   || "info@veridianrisk.com";

  console.log("[contact] ENV:", {
    RESEND_API_KEY:        resendKey  ? `set (${resendKey.slice(0,6)}…)` : "MISSING",
    FROM_DOMAIN:           process.env.FROM_DOMAIN           || "NOT SET — using default: veridianrisk.com",
    TEAM_EMAIL:            process.env.TEAM_EMAIL            || "NOT SET — using default: info@veridianrisk.com",
    KV_REST_API_URL:       process.env.KV_REST_API_URL       ? "set" : "MISSING",
    KV_REST_API_TOKEN:     process.env.KV_REST_API_TOKEN     ? "set" : "MISSING",
    GOHIGHLEVEL_API_KEY:   process.env.GOHIGHLEVEL_API_KEY   ? "set" : "not set",
    GOHIGHLEVEL_LOCATION_ID: process.env.GOHIGHLEVEL_LOCATION_ID ? "set" : "not set",
    CONTACT_WEBHOOK_URL:   process.env.CONTACT_WEBHOOK_URL   ? "set" : "not set",
  });

  let body;
  try { body = await req.json(); }
  catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400, headers: { "Content-Type": "application/json" },
    });
  }

  const { name, email, biz, phone, challenge, calcData } = body;
  if (!name?.trim() || !email?.trim()) {
    return new Response(JSON.stringify({ error: "Name and email are required." }), {
      status: 400, headers: { "Content-Type": "application/json" },
    });
  }

  const leadId = mkId();
  const ts = new Date().toISOString();
  const annual = calcData?.annualPotential || 0;
  const p = priority(annual, challenge);
  const firstName = name.trim().split(" ")[0];

  console.log(`[contact] new lead: ${leadId} | priority=${p} | annual=$${annual} | from=${email.trim()}`);

  const calcBlock = calcData
    ? [
        `Monthly calls: ${calcData.calls}  |  Miss rate: ${calcData.miss}%  |  Avg value: $${calcData.val}  |  Conv: ${calcData.conv}%`,
        `Missed/mo: ${calcData.missedPerMonth}  |  At risk: $${calcData.lostMonthly}/mo  |  Recovery: $${calcData.recoveryMonthly}/mo`,
        `Annual potential: ${fmtAnnual(annual)}`,
      ].join("\n")
    : "No calculator data — direct contact.";

  const crmEntry = {
    leadId,
    timestamp: ts,
    source: "veridian-website",
    priority: p,
    followUpTrigger: true,
    contact: { name: name.trim(), email: email.trim(), phone: phone || "", business: biz || "" },
    challenge: challenge || "",
    calcData: calcData || null,
    recoveryEstimate: fmtAnnual(annual),
  };

  const webhookUrl = process.env.CONTACT_WEBHOOK_URL;
  const subjectSuffix = annual > 0 ? ` | Est. ${fmtAnnual(annual)}/yr` : "";

  const promises = [];

  // KV storage
  promises.push(kv("SET", `veridian:lead:${leadId}`, JSON.stringify(crmEntry)));
  promises.push(kv("LPUSH", "veridian:leads", JSON.stringify(crmEntry)));

  // KV follow-up queue
  const now = Date.now();
  promises.push(kv("ZADD", "veridian:fu:24h",  String(now + 86400000),   leadId));
  promises.push(kv("ZADD", "veridian:fu:3d",   String(now + 259200000),  leadId));
  promises.push(kv("ZADD", "veridian:fu:7d",   String(now + 604800000),  leadId));
  promises.push(kv("ZADD", "veridian:fu:14d",  String(now + 1209600000), leadId));

  // GHL
  promises.push(ghlIntegration(crmEntry, annual, calcBlock, fmtAnnual));

  // Email
  if (!resendKey) {
    console.error("[contact] RESEND_API_KEY is missing — no emails will be sent");
  } else {
    const teamText = `[${p}] NEW LEAD — VERIDIAN\nLead ID: ${leadId}\nSubmitted: ${ts}\n\nCONTACT\nName:     ${name.trim()}\nBusiness: ${biz || "(not provided)"}\nEmail:    ${email.trim()}\nPhone:    ${phone || "(not provided)"}\n\nREVENUE CALCULATOR\n${calcBlock}\n\nCHALLENGE\n${challenge || "(not provided)"}\n\n---\nPriority: ${p} — follow up within 1 business day.`;

    const recoveryLine = annual > 0
      ? `Based on your calculator inputs, we estimate ${fmtAnnual(annual)} per year in recoverable revenue is within reach.`
      : "We'll assess your recovery potential during our review.";

    const prospectText = `Hi ${firstName},\n\nThanks for reaching out to Veridian.\n\n${recoveryLine}\n\nA member of our team will be in touch within one business day with your personalized revenue recovery assessment.\n\nWhat to expect:\n- Review your business type and call volume\n- Identify your highest-impact recovery opportunities\n- Propose a specific plan with projected outcomes\n\n— The Veridian Team\n${toEmail}`;

    promises.push(
      sendEmail(resendKey, {
        from: `Veridian <noreply@${fromDomain}>`,
        to: [toEmail],
        subject: `[${p}] New lead: ${name.trim()} — ${biz || "Unknown"}${subjectSuffix}`,
        text: teamText,
      }, "team-alert"),

      sendEmail(resendKey, {
        from: `Veridian <hello@${fromDomain}>`,
        to: [email.trim()],
        reply_to: toEmail,
        subject: "Your Veridian Revenue Assessment — We're on it",
        text: prospectText,
      }, "prospect-confirm"),
    );
  }

  if (webhookUrl) {
    promises.push(
      fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(crmEntry),
      }).catch(err => console.error("[contact] webhook ERROR:", err?.message))
    );
  }

  const results = await Promise.allSettled(promises);
  const failed = results.filter(r => r.status === "rejected");
  if (failed.length > 0) {
    console.error(`[contact] ${failed.length} promise(s) rejected:`, failed.map(r => r.reason?.message || r.reason));
  }
  console.log(`[contact] done — leadId=${leadId} priority=${p}`);

  return new Response(JSON.stringify({ success: true, leadId, priority: p }), {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}
