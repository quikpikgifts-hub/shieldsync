export const config = { runtime: "edge" };

import { kv } from "../../../_lib/kv.js";
import { exchangeCodeForToken, saveToken } from "../../../_lib/publishers/tiktok.js";

function redirectToApp(status) {
  return new Response(null, {
    status: 302,
    headers: { Location: `/app?tiktok=${status}` },
  });
}

export default async function handler(req) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const err = url.searchParams.get("error");

  if (err) {
    console.error("[tiktok/callback] TikTok returned an error:", err);
    return redirectToApp("error");
  }
  if (!code || !state) {
    return redirectToApp("error");
  }

  const stateKey = `veridian:social:tiktok:oauth_state:${state}`;
  const validState = await kv("GET", stateKey);
  if (!validState) {
    console.error("[tiktok/callback] missing or expired OAuth state — possible CSRF or timeout");
    return redirectToApp("error");
  }
  await kv("DEL", stateKey);

  try {
    const tokenResponse = await exchangeCodeForToken(code);
    await saveToken(tokenResponse);
    return redirectToApp("connected");
  } catch (e) {
    console.error("[tiktok/callback] token exchange failed:", e.message);
    return redirectToApp("error");
  }
}
