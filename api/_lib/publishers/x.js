// X API v2 — POST /2/tweets.
// Activation requires: an X developer app on a paid API tier (the free tier
// does not include write access as of this writing — verify current pricing
// before relying on this), OAuth 2.0 user context per connected account.
import { configOnlyConnectionState } from "./states.js";

export const platform = "x";
export const requiredEnv = ["X_CLIENT_ID", "X_CLIENT_SECRET"];
// Verify against X's current docs before relying on this.
export const requiredScopes = ["tweet.read", "tweet.write", "users.read", "offline.access"];

export function isConfigured() {
  return requiredEnv.every((k) => Boolean(process.env[k]));
}

export async function getConnectionState() {
  return configOnlyConnectionState(isConfigured);
}

export async function publish({ caption, hashtags, mediaUrl, userAccessToken }) {
  if (!isConfigured()) return { ok: false, reason: "not_configured", requiredEnv };
  if (!userAccessToken) return { ok: false, reason: "account_not_connected" };
  const text = hashtags ? `${caption}\n\n${hashtags}` : caption;
  if (text.length > 280) return { ok: false, reason: "over_character_limit", length: text.length };
  // TODO: POST /2/tweets with userAccessToken, once the OAuth flow issuing
  // it per connected account exists.
  return { ok: false, reason: "not_implemented" };
}
