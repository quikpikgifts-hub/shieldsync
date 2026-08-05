export const config = { runtime: "edge" };

import { kv } from "../../../_lib/kv.js";
import { buildAuthorizeUrl, isConfigured } from "../../../_lib/publishers/tiktok.js";

// Redirects the founder's browser to TikTok's OAuth consent screen. A
// random state is stored briefly in KV so the callback can reject any
// request that doesn't round-trip the same value (CSRF protection).
export default async function handler(req) {
  if (!isConfigured()) {
    return new Response("TikTok is not configured yet (missing TIKTOK_CLIENT_KEY/SECRET/REDIRECT_URI).", { status: 503 });
  }

  const state = crypto.randomUUID();
  await kv("SET", `veridian:social:tiktok:oauth_state:${state}`, "1");
  await kv("EXPIRE", `veridian:social:tiktok:oauth_state:${state}`, 600); // 10 minutes to complete the flow

  return new Response(null, {
    status: 302,
    headers: { Location: buildAuthorizeUrl(state) },
  });
}
