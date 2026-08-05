// YouTube Data API v3 — video upload (Shorts is just a vertical <60s video).
// Activation requires: a Google Cloud project with the YouTube Data API
// enabled, OAuth consent screen verification (uploading on a user's behalf
// needs the youtube.upload scope, which Google reviews), and per-channel
// OAuth tokens.
import { configOnlyConnectionState } from "./states.js";

export const platform = "youtube";
export const requiredEnv = ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"];

export function isConfigured() {
  return requiredEnv.every((k) => Boolean(process.env[k]));
}

export async function getConnectionState() {
  return configOnlyConnectionState(isConfigured);
}

export async function publish({ caption, hashtags, mediaUrl, userAccessToken }) {
  if (!isConfigured()) return { ok: false, reason: "not_configured", requiredEnv };
  if (!mediaUrl) return { ok: false, reason: "media_required" }; // video file required
  if (!userAccessToken) return { ok: false, reason: "account_not_connected" };
  // TODO: resumable upload via POST /upload/youtube/v3/videos, once the
  // OAuth flow issuing userAccessToken per connected channel exists.
  return { ok: false, reason: "not_implemented" };
}
