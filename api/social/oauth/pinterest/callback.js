export const config = { runtime: "edge" };

import { exchangeCodeForToken, saveToken, consumeOAuthState, verifyConnection } from "../../../_lib/publishers/pinterest.js";

function redirectToApp(status) {
  return new Response(null, {
    status: 302,
    headers: { Location: `/app?pinterest=${status}` },
  });
}

export default async function handler(req) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const err = url.searchParams.get("error");

  if (err) {
    console.error("[pinterest/callback] Pinterest returned an error:", err);
    return redirectToApp("error");
  }
  if (!code || !state) {
    return redirectToApp("error");
  }

  const validState = await consumeOAuthState(state);
  if (!validState) {
    console.error("[pinterest/callback] missing or expired OAuth state — possible CSRF or timeout");
    return redirectToApp("error");
  }

  try {
    const tokenResponse = await exchangeCodeForToken(code);
    await saveToken(tokenResponse);
    await verifyConnection(); // learns the default board_id immediately, same as LinkedIn/YouTube's post-connect lookups
    return redirectToApp("connected");
  } catch (e) {
    console.error("[pinterest/callback] token exchange failed:", e.message);
    return redirectToApp("error");
  }
}
