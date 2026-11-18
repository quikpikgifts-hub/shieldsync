export const config = { runtime: "edge" };

import { getPublisher, listPublishers } from "../_lib/publishers/index.js";

const CORS = { "Access-Control-Allow-Origin": "*", "Vary": "Origin" };

export default async function handler(req) {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: { ...CORS, "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization" },
    });
  }

  // GET exposes connection state only; it never publishes content.
  if (req.method === "GET") {
    return new Response(JSON.stringify({ publishers: await listPublishers() }), {
      headers: { "Content-Type": "application/json", ...CORS },
    });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: CORS });
  }

  // Fail closed until tenant-scoped authorization, persisted approval records,
  // and per-client publisher credentials are implemented and tested.
  // A browser-provided status flag is not a trustworthy approval control.
  if (process.env.SOCIAL_PUBLISHING_ENABLED !== "true") {
    return new Response(JSON.stringify({
      published: false,
      reason: "publishing_locked",
      error: "Publishing is disabled until client authorization and server-side approval controls are enabled.",
    }), {
      status: 423,
      headers: { "Content-Type": "application/json", ...CORS },
    });
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
