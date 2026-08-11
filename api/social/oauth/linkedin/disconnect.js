export const config = { runtime: "edge" };

import { disconnectAccount } from "../../../_lib/publishers/linkedin.js";

const CORS = { "Access-Control-Allow-Origin": "*" };

export default async function handler(req) {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: { ...CORS, "Access-Control-Allow-Methods": "POST, OPTIONS" } });
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: CORS });
  }
  await disconnectAccount();
  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json", ...CORS },
  });
}
