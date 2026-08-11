export const config = { runtime: "edge" };

import { buildAuthorizeUrl, isConfigured, storeOAuthState } from "../../../_lib/publishers/youtube.js";

export default async function handler(req) {
  if (!isConfigured()) {
    return new Response("YouTube is not configured yet (missing GOOGLE_CLIENT_ID/SECRET/REDIRECT_URI).", { status: 503 });
  }

  const state = crypto.randomUUID();
  await storeOAuthState(state);

  return new Response(null, {
    status: 302,
    headers: { Location: buildAuthorizeUrl(state) },
  });
}
