export const config = { runtime: "edge" };

import { buildAuthorizeUrl, isConfigured, storeOAuthState } from "../../../_lib/publishers/pinterest.js";

export default async function handler(req) {
  if (!isConfigured()) {
    return new Response("Pinterest is not configured yet (missing PINTEREST_CLIENT_ID/SECRET/REDIRECT_URI).", { status: 503 });
  }

  const state = crypto.randomUUID();
  await storeOAuthState(state);

  return new Response(null, {
    status: 302,
    headers: { Location: buildAuthorizeUrl(state) },
  });
}
