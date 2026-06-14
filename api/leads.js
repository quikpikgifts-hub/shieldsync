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

function checkPin(req) {
  const expected = process.env.DASH_PIN || "0000";
  const auth = req.headers.get("authorization") || "";
  const pin = auth.startsWith("Bearer ") ? auth.slice(7) : new URL(req.url).searchParams.get("pin") || "";
  return pin === expected;
}

async function enrichLead(lead) {
  if (!lead.leadId) return lead;
  const [booked, statusRaw] = await Promise.all([
    kv("EXISTS", `veridian:booked:${lead.leadId}`),
    kv("GET", `veridian:status:${lead.leadId}`),
  ]);
  const status = statusRaw ? (typeof statusRaw === "string" ? JSON.parse(statusRaw) : statusRaw) : {};
  return { ...lead, booked: Number(booked) > 0, ...status };
}

export default async function handler(req) {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  // GET — return all leads enriched with status
  if (req.method === "GET") {
    if (!checkPin(req)) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { "Content-Type": "application/json" },
      });
    }
    const raw = await kv("LRANGE", "veridian:leads", 0, 199);
    if (!raw) {
      return new Response(JSON.stringify({ leads: [], configured: false }), {
        headers: { "Content-Type": "application/json" },
      });
    }
    const leads = raw
      .map(item => { try { return JSON.parse(item); } catch { return null; } })
      .filter(Boolean);
    const enriched = await Promise.all(leads.map(enrichLead));
    return new Response(JSON.stringify({ leads: enriched, configured: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // PATCH — update lead status (proposal sent, won, monthly revenue)
  if (req.method === "PATCH") {
    if (!checkPin(req)) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { "Content-Type": "application/json" },
      });
    }
    let body;
    try { body = await req.json(); } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400, headers: { "Content-Type": "application/json" },
      });
    }
    const { leadId, action, value } = body;
    if (!leadId || !action) {
      return new Response(JSON.stringify({ error: "leadId and action required" }), {
        status: 400, headers: { "Content-Type": "application/json" },
      });
    }
    const raw = await kv("GET", `veridian:status:${leadId}`);
    const status = raw ? (typeof raw === "string" ? JSON.parse(raw) : raw) : {};
    const ts = new Date().toISOString();

    if (action === "proposal") { status.proposalSent = true; status.proposalDate = ts; }
    else if (action === "won") { status.clientWon = true; status.wonDate = ts; if (value) status.monthlyRevenue = Number(value); }
    else if (action === "revenue") { status.monthlyRevenue = Number(value); }
    else if (action === "unmark_won") { status.clientWon = false; }
    else if (action === "unmark_proposal") { status.proposalSent = false; }

    await kv("SET", `veridian:status:${leadId}`, JSON.stringify(status));
    return new Response(JSON.stringify({ success: true, status }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // POST — self-ingestion (CONTACT_WEBHOOK_URL = /api/leads)
  if (req.method === "POST") {
    let body;
    try { body = await req.json(); } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400, headers: { "Content-Type": "application/json" },
      });
    }
    if (!body.leadId || !body.contact?.email) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), {
        status: 400, headers: { "Content-Type": "application/json" },
      });
    }
    await Promise.all([
      kv("LPUSH", "veridian:leads", JSON.stringify(body)),
      kv("SET", `veridian:lead:${body.leadId}`, JSON.stringify(body)),
    ]);
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  return new Response("Method not allowed", { status: 405 });
}
