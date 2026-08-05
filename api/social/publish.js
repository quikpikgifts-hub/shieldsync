export const config = { runtime: "edge" };

import { getPublisher, listPublishers } from "../_lib/publishers/index.js";

const CORS = { "Access-Control-Allow-Origin": "*" };

export default async function handler(req) {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: { ...CORS, "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" },
    });
  }

  // GET — which platforms are connected, so the UI can show real state
  // instead of guessing.
  if (req.method === "GET") {
    return new Response(JSON.stringify({ publishers: listPublishers() }), {
      headers: { "Content-Type": "application/json", ...CORS },
    });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: CORS });
  }

  let body;
  try { body = await req.json(); }
  catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400, headers: { "Content-Type": "application/json", ...CORS },
    });
  }

  const { platform, item } = body;
  const publisher = getPublisher(platform);
  if (!publisher) {
    return new Response(JSON.stringify({ error: `Unknown platform: ${platform}` }), {
      status: 400, headers: { "Content-Type": "application/json", ...CORS },
    });
  }
  if (!item?.caption) {
    return new Response(JSON.stringify({ error: "item.caption is required" }), {
      status: 400, headers: { "Content-Type": "application/json", ...CORS },
    });
  }

  try {
    const result = await publisher.publish(item);
    // Not an error — this is the expected, honest state until credentials
    // and OAuth exist. The UI treats this as "fall back to manual posting."
    return new Response(JSON.stringify({ published: result.ok === true, ...result }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...CORS },
    });
  } catch (e) {
    console.error(`[social/publish] error for platform=${platform}:`, e?.message || String(e));
    return new Response(JSON.stringify({ published: false, reason: "publish_error", error: e.message }), {
      status: 500, headers: { "Content-Type": "application/json", ...CORS },
    });
  }
}
