export const config = { runtime: "edge" };

import { buildAuthorizeUrl, isConfigured, generateCodeVerifier, generateCodeChallenge, storeOAuthState } from "../../../_lib/publishers/x.js";

// Redirects the founder's browser to X's OAuth 2.0 + PKCE consent screen.
// The code_verifier is generated here and stashed in KV under the random
// state value so the callback (a separate request) can retrieve it for the
// token exchange — X requires PKCE regardless of client type.
export default async function handler(req) {
  if (!isConfigured()) {
    return new Response("X is not configured yet (missing X_CLIENT_ID/SECRET/REDIRECT_URI).", { status: 503 });
  }

  const state = crypto.randomUUID();
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  await storeOAuthState(state, codeVerifier);

  return new Response(null, {
    status: 302,
    headers: { Location: buildAuthorizeUrl(state, codeChallenge) },
  });
}
