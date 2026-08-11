// Meta Graph API — Facebook Page posts. Unlike TikTok/X, this platform is
// designed around a pre-obtained, long-lived Page Access Token (Meta's own
// recommended pattern for a single-Page integration) rather than a full
// "Login with Facebook" OAuth dance — that keeps this out of Meta's App
// Review requirements for anything beyond your own Page. Activation
// requires: a Meta developer app, a Page, and a long-lived Page access
// token generated once via Meta's Graph API Explorer / Business Settings
// (see ACTIVATION.md) with pages_manage_posts scope.
//
// Not live-tested — implemented against Meta's documented Graph API v19
// shape, verified with mocked HTTP calls (see facebook.test.js).

import { CONNECTION_STATES } from "./states.js";

export const platform = "facebook";
export const requiredEnv = ["META_PAGE_ACCESS_TOKEN", "META_FACEBOOK_PAGE_ID"];
// Verify against Meta's current docs before relying on this — permission
// names have changed before and Meta reviews them individually.
export const requiredScopes = ["pages_manage_posts", "pages_read_engagement"];

const GRAPH_BASE = "https://graph.facebook.com/v19.0";

export function isConfigured() {
  return requiredEnv.every((k) => Boolean(process.env[k]));
}

// No separate "connect account" step exists for a static Page token — the
// token itself is the credential, so this goes straight to Connected once
// configured rather than sitting at a misleading "Configuration Required"
// forever (no OAuth flow means it never reaches ready_to_activate).
export async function getConnectionState() {
  if (!isConfigured()) return { state: CONNECTION_STATES.WAITING_FOR_CREDENTIALS };
  return { state: CONNECTION_STATES.CONNECTED };
}

export async function publish({ caption, hashtags, mediaUrl }) {
  if (!isConfigured()) return { ok: false, reason: "not_configured", requiredEnv };
  const message = hashtags ? `${caption}\n\n${hashtags}` : caption;
  if (!message || !message.trim()) return { ok: false, reason: "caption_required" };

  const pageId = process.env.META_FACEBOOK_PAGE_ID;
  const accessToken = process.env.META_PAGE_ACCESS_TOKEN;
  const endpoint = mediaUrl ? `${GRAPH_BASE}/${pageId}/photos` : `${GRAPH_BASE}/${pageId}/feed`;
  const params = new URLSearchParams({ access_token: accessToken });
  if (mediaUrl) {
    params.set("url", mediaUrl);
    params.set("caption", message);
  } else {
    params.set("message", message);
  }

  try {
    const r = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: params.toString() });
    const data = await r.json().catch(() => ({}));
    if (!r.ok || data.error) {
      return { ok: false, reason: "publish_error", detail: data.error?.message || `HTTP ${r.status}` };
    }
    return { ok: true, postId: data.post_id || data.id };
  } catch (e) {
    return { ok: false, reason: "publish_error", detail: e.message };
  }
}
