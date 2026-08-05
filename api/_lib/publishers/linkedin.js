// LinkedIn Marketing/Share API (UGC Posts).
// Activation requires: a LinkedIn app, Sign In with LinkedIn + Share on
// LinkedIn products approved on the app, and per-user OAuth (personal
// profile) or an organization access token (company Page).
export const platform = "linkedin";
export const requiredEnv = ["LINKEDIN_CLIENT_ID", "LINKEDIN_CLIENT_SECRET"];

export function isConfigured() {
  return requiredEnv.every((k) => Boolean(process.env[k]));
}

export async function publish({ caption, hashtags, mediaUrl, userAccessToken, authorUrn }) {
  if (!isConfigured()) return { ok: false, reason: "not_configured", requiredEnv };
  if (!userAccessToken || !authorUrn) return { ok: false, reason: "account_not_connected" };
  // TODO: POST /v2/ugcPosts with the author URN and access token, once the
  // OAuth flow issuing those per connected account exists.
  return { ok: false, reason: "not_implemented" };
}
