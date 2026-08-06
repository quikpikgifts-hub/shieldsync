export const config = { runtime: "edge" };

import { kvRateLimit } from "./_lib/kv.js";
import { cleanEnv, sendEmail } from "./_lib/email.js";
import { mkId } from "./_lib/ids.js";
import { priorityFromRevenue } from "./_lib/priority.js";
import { recordLead, scheduleFollowUps } from "./_lib/store.js";

function fmtAnnual(n) {
  if (!n || n === 0) return null;
  return n >= 1000 ? `$${(n / 1000).toFixed(1)}K` : `$${n}`;
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

  if (await kvRateLimit(req, { prefix: "contact", max: 3, windowSec: 600 })) {
    return new Response(JSON.stringify({ error: "Too many requests. Please try again later." }), {
      status: 429,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  const resendKey  = process.env.RESEND_API_KEY;
  const fromDomain = cleanEnv(process.env.FROM_DOMAIN) || "veridianriskgroup.org";
  const toEmail    = cleanEnv(process.env.TEAM_EMAIL)   || "info@veridianriskgroup.org";

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

  if (body._hp) {
    return new Response(JSON.stringify({ success: true, leadId: "filtered" }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  const leadId = mkId("vrd");
  const ts = new Date().toISOString();
  const annual = calcData?.annualPotential || 0;
  const p = priorityFromRevenue(annual, challenge);
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
    notes: calcData
      ? `Recovery: ${fmtAnnual(annual) || "N/A"} | Calls/mo: ${calcData.calls} | Miss rate: ${calcData.miss}% | Avg value: $${calcData.val} | Conv: ${calcData.conv}%`
      : null,
  };

  const webhookUrl = process.env.CONTACT_WEBHOOK_URL;
  const subjectSuffix = annual > 0 ? ` | Est. ${fmtAnnual(annual)}/yr` : "";

  // Single write path — dual-writes to KV (dashboard/follow-up cron) and
  // Supabase (metrics) together instead of two independently-maintained blocks.
  const { sbResult } = await recordLead(crmEntry);

  const promises = [];
  promises.push(scheduleFollowUps(leadId, ["24h", "3d", "7d", "14d"]));
  promises.push(ghlIntegration(crmEntry, annual, calcBlock, fmtAnnual));

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
      }, "team-alert", "contact"),

      sendEmail(resendKey, {
        from: `Veridian <hello@${fromDomain}>`,
        to: [email.trim()],
        reply_to: toEmail,
        subject: "Your Veridian Revenue Assessment — We're on it",
        text: prospectText,
      }, "prospect-confirm", "contact"),
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

  return new Response(JSON.stringify({
    success: true,
    leadId,
    priority: p,
    supabaseStatus: sbResult?.status ?? null,
    supabaseBody: sbResult?.body ?? sbResult?.error ?? null,
  }), {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}
