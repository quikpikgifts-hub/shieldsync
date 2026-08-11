export const config = { runtime: "edge" };

import { exchangeCodeForToken, saveToken, consumeOAuthState } from "../../../_lib/publishers/x.js";

function redirectToApp(status) {
  return new Response(null, {
    status: 302,
    headers: { Location: `/app?x=${status}` },
  });
}

export default async function handler(req) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const err = url.searchParams.get("error");

  if (err) {
    console.error("[x/callback] X returned an error:", err);
    return redirectToApp("error");
  }
  if (!code || !state) {
    return redirectToApp("error");
  }

  const codeVerifier = await consumeOAuthState(state);
  if (!codeVerifier) {
    console.error("[x/callback] missing or expired OAuth state — possible CSRF or timeout");
    return redirectToApp("error");
  }

  try {
    const tokenResponse = await exchangeCodeForToken(code, codeVerifier);
    await saveToken(tokenResponse);
    return redirectToApp("connected");
  } catch (e) {
    console.error("[x/callback] token exchange failed:", e.message);
    return redirectToApp("error");
  }
}
