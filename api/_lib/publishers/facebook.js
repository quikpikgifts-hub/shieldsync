// Meta Graph API — Facebook Page posts.
// Activation requires: a Meta developer app, a Page access token with
// pages_manage_posts scope, and (for anything beyond your own test Pages)
// Meta's App Review for that permission.
import { configOnlyConnectionState } from "./states.js";

export const platform = "facebook";
export const requiredEnv = ["META_PAGE_ACCESS_TOKEN", "META_FACEBOOK_PAGE_ID"];

export function isConfigured() {
  return requiredEnv.every((k) => Boolean(process.env[k]));
}

export async function getConnectionState() {
  return configOnlyConnectionState(isConfigured);
}

export async function publish({ caption, hashtags, mediaUrl }) {
  if (!isConfigured()) return { ok: false, reason: "not_configured", requiredEnv };
  // TODO: POST to https://graph.facebook.com/v19.0/{page-id}/feed (text) or
  // /photos (with mediaUrl) using META_PAGE_ACCESS_TOKEN, once provisioned.
  return { ok: false, reason: "not_implemented" };
}
