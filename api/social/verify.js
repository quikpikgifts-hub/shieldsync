export const config = { runtime: "edge" };

import { verifyPublisherConnection } from "../_lib/publishers/index.js";

const CORS = { "Access-Control-Allow-Origin": "*" };

export default async function handler(req) {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: { ...CORS, "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" } });
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: CORS });
  }

  let body;
  try { body = await req.json(); }
  catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: { "Content-Type": "application/json", ...CORS } });
  }

  const result = await verifyPublisherConnection(body.platform);
  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json", ...CORS },
  });
}
