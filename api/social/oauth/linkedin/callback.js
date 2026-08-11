export const config = { runtime: "edge" };

import { exchangeCodeForToken, saveToken, consumeOAuthState, verifyConnection } from "../../../_lib/publishers/linkedin.js";

function redirectToApp(status) {
  return new Response(null, {
    status: 302,
    headers: { Location: `/app?linkedin=${status}` },
  });
}

export default async function handler(req) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const err = url.searchParams.get("error");

  if (err) {
    console.error("[linkedin/callback] LinkedIn returned an error:", err);
    return redirectToApp("error");
  }
  if (!code || !state) {
    return redirectToApp("error");
  }

  const validState = await consumeOAuthState(state);
  if (!validState) {
    console.error("[linkedin/callback] missing or expired OAuth state — possible CSRF or timeout");
    return redirectToApp("error");
  }

  try {
    const tokenResponse = await exchangeCodeForToken(code);
    await saveToken(tokenResponse);
    // LinkedIn's Posts API needs the author's URN, which isn't in the token
    // response — learn it immediately via userinfo rather than waiting for
    // a manual "Verify connection" click before the founder can publish.
    await verifyConnection();
    return redirectToApp("connected");
  } catch (e) {
    console.error("[linkedin/callback] token exchange failed:", e.message);
    return redirectToApp("error");
  }
}
