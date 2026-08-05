// Pinterest API v5 — POST /v5/pins.
// Activation requires: a Pinterest developer app approved for standard API
// access (trial access is heavily rate-limited), OAuth per connected
// Pinterest account, and a board to pin to.
import { configOnlyConnectionState } from "./states.js";

export const platform = "pinterest";
export const requiredEnv = ["PINTEREST_CLIENT_ID", "PINTEREST_CLIENT_SECRET"];

export function isConfigured() {
  return requiredEnv.every((k) => Boolean(process.env[k]));
}

export async function getConnectionState() {
  return configOnlyConnectionState(isConfigured);
}

export async function publish({ caption, hashtags, mediaUrl, userAccessToken, boardId }) {
  if (!isConfigured()) return { ok: false, reason: "not_configured", requiredEnv };
  if (!mediaUrl) return { ok: false, reason: "media_required" }; // Pinterest pins require an image
  if (!userAccessToken || !boardId) return { ok: false, reason: "account_not_connected" };
  // TODO: POST /v5/pins with board_id + media_source, once the OAuth flow
  // issuing userAccessToken and a selected board per connected account exists.
  return { ok: false, reason: "not_implemented" };
}
