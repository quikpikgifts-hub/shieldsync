// Meta Graph API — Instagram Content Publishing API. Same static-token
// design as facebook.js (see that file's header comment) — a long-lived
// access token for the Instagram Business/Creator account, obtained once
// outside this app, not a per-request OAuth flow.
//
// Activation requires: an Instagram Business/Creator account linked to a
// Facebook Page, a Meta app with instagram_content_publish (App Review
// required for anything beyond your own account), and a media URL that's
// publicly reachable (Meta fetches it server-side — data URLs / localhost
// won't work).
//
// Not live-tested — implemented against Meta's documented Content
// Publishing API shape, verified with mocked HTTP calls (see
// instagram.test.js).

import { CONNECTION_STATES } from "./states.js";

export const platform = "instagram";
export const requiredEnv = ["META_ACCESS_TOKEN", "META_INSTAGRAM_ACCOUNT_ID"];
// Verify against Meta's current docs before relying on this.
export const requiredScopes = ["instagram_content_publish", "instagram_basic"];

const GRAPH_BASE = "https://graph.facebook.com/v19.0";

export function isConfigured() {
  return requiredEnv.every((k) => Boolean(process.env[k]));
}

// Same reasoning as facebook.js: a static token has no separate
// "connect account" step, so this goes straight to Connected once
// configured instead of stalling at Configuration Required forever.
export async function getConnectionState() {
  if (!isConfigured()) return { state: CONNECTION_STATES.WAITING_FOR_CREDENTIALS };
  return { state: CONNECTION_STATES.CONNECTED };
}

export async function publish({ caption, hashtags, mediaUrl }) {
  if (!isConfigured()) return { ok: false, reason: "not_configured", requiredEnv };
  if (!mediaUrl) return { ok: false, reason: "media_required" }; // Instagram publishing requires an image/video

  const igUserId = process.env.META_INSTAGRAM_ACCOUNT_ID;
  const accessToken = process.env.META_ACCESS_TOKEN;
  const text = hashtags ? `${caption}\n\n${hashtags}` : caption;

  try {
    // Step 1: create a media container.
    const createParams = new URLSearchParams({ image_url: mediaUrl, caption: text || "", access_token: accessToken });
    const createRes = await fetch(`${GRAPH_BASE}/${igUserId}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: createParams.toString(),
    });
    const createData = await createRes.json().catch(() => ({}));
    if (!createRes.ok || createData.error || !createData.id) {
      return { ok: false, reason: "publish_error", detail: createData.error?.message || `HTTP ${createRes.status}` };
    }

    // Step 2: publish the container.
    const publishParams = new URLSearchParams({ creation_id: createData.id, access_token: accessToken });
    const publishRes = await fetch(`${GRAPH_BASE}/${igUserId}/media_publish`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: publishParams.toString(),
    });
    const publishData = await publishRes.json().catch(() => ({}));
    if (!publishRes.ok || publishData.error || !publishData.id) {
      return { ok: false, reason: "publish_error", detail: publishData.error?.message || `HTTP ${publishRes.status}` };
    }

    return { ok: true, mediaId: publishData.id };
  } catch (e) {
    return { ok: false, reason: "publish_error", detail: e.message };
  }
}
