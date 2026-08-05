// TikTok Content Posting API — real implementation (Founder Alpha's pilot
// platform, per the executive directive). Single-tenant by design: Founder
// Alpha assumes exactly one user, so the connected account's tokens live
// under one well-known KV key rather than a per-user schema. Revisit this
// the moment a second real user exists (Sprint 1 of the platform strategy).
//
// PRECONDITIONS the founder must complete in the TikTok Developer Portal
// before this can work, beyond setting env vars:
//   1. Register an app, enable the Content Posting API product, request the
//      video.publish scope.
//   2. Verify the domain this app is deployed on (TikTok requires domain
//      verification for PULL_FROM_URL video sources — a DNS TXT record or
//      hosted verification file, done in their portal, not in this code).
//   3. Until the app passes TikTok's audit, posts can only use
//      privacy_level "SELF_ONLY" (visible only to the poster) — this is
//      the default here and is NOT a bug; TIKTOK_PRIVACY_LEVEL overrides it
//      once the app is audited and approved for public posting.
//
// None of this has been exercised against a live TikTok account — it's
// implemented against TikTok's documented v2 API shape and structurally
// verified with mocked HTTP calls (see tiktok.test.js), not live-tested.
// Treat the first real attempt as a test, not a guaranteed-working path.

import { kv } from "../kv.js";
import { CONNECTION_STATES } from "./states.js";

export const platform = "tiktok";
export const requiredEnv = ["TIKTOK_CLIENT_KEY", "TIKTOK_CLIENT_SECRET", "TIKTOK_REDIRECT_URI"];

const TOKEN_KEY = "veridian:social:tiktok:token";
const AUTH_BASE = "https://www.tiktok.com/v2/auth/authorize/";
const TOKEN_URL = "https://open.tiktokapis.com/v2/oauth/token/";
const PUBLISH_INIT_URL = "https://open.tiktokapis.com/v2/post/publish/video/init/";
const PUBLISH_STATUS_URL = "https://open.tiktokapis.com/v2/post/publish/status/fetch/";

export function isConfigured() {
  return requiredEnv.every((k) => Boolean(process.env[k]));
}

export function buildAuthorizeUrl(state) {
  const params = new URLSearchParams({
    client_key: process.env.TIKTOK_CLIENT_KEY,
    scope: "user.info.basic,video.publish",
    response_type: "code",
    redirect_uri: process.env.TIKTOK_REDIRECT_URI,
    state,
  });
  return `${AUTH_BASE}?${params.toString()}`;
}

export async function exchangeCodeForToken(code) {
  const r = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "Cache-Control": "no-cache" },
    body: new URLSearchParams({
      client_key: process.env.TIKTOK_CLIENT_KEY,
      client_secret: process.env.TIKTOK_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
      redirect_uri: process.env.TIKTOK_REDIRECT_URI,
    }).toString(),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok || data.error) throw new Error(data.error_description || data.error || "TikTok token exchange failed");
  return data; // { access_token, expires_in, refresh_token, refresh_expires_in, open_id, scope, token_type }
}

async function refreshToken(stored) {
  const r = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "Cache-Control": "no-cache" },
    body: new URLSearchParams({
      client_key: process.env.TIKTOK_CLIENT_KEY,
      client_secret: process.env.TIKTOK_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: stored.refresh_token,
    }).toString(),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok || data.error) throw new Error(data.error_description || data.error || "TikTok token refresh failed");
  return data;
}

export async function saveToken(tokenResponse) {
  const record = {
    access_token: tokenResponse.access_token,
    refresh_token: tokenResponse.refresh_token,
    open_id: tokenResponse.open_id,
    scope: tokenResponse.scope,
    expires_at: Date.now() + (tokenResponse.expires_in || 0) * 1000,
  };
  await kv("SET", TOKEN_KEY, JSON.stringify(record));
  return record;
}

export async function getStoredToken() {
  const raw = await kv("GET", TOKEN_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export async function disconnectAccount() {
  await kv("DEL", TOKEN_KEY);
}

// Returns a valid access token, transparently refreshing if it's expired
// (or about to expire) and persisting the refreshed token.
async function getValidAccessToken() {
  const stored = await getStoredToken();
  if (!stored) return null;
  const expiresInMs = stored.expires_at - Date.now();
  if (expiresInMs > 5 * 60 * 1000) return stored.access_token; // still good for 5+ minutes
  try {
    const refreshed = await refreshToken(stored);
    const saved = await saveToken({ ...refreshed, open_id: refreshed.open_id || stored.open_id });
    return saved.access_token;
  } catch {
    return null; // refresh failed — treat as disconnected rather than throwing mid-publish
  }
}

export async function getConnectionState() {
  if (!isConfigured()) return { state: CONNECTION_STATES.WAITING_FOR_CREDENTIALS };
  const token = await getValidAccessToken();
  if (!token) return { state: CONNECTION_STATES.READY_TO_ACTIVATE };
  return { state: CONNECTION_STATES.CONNECTED };
}

export async function publish({ caption, mediaUrl }) {
  if (!isConfigured()) return { ok: false, reason: "not_configured", requiredEnv };
  if (!mediaUrl) return { ok: false, reason: "media_required" };

  const accessToken = await getValidAccessToken();
  if (!accessToken) return { ok: false, reason: "account_not_connected" };

  const privacyLevel = process.env.TIKTOK_PRIVACY_LEVEL || "SELF_ONLY";

  try {
    const initRes = await fetch(PUBLISH_INIT_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        post_info: {
          title: (caption || "").slice(0, 150),
          privacy_level: privacyLevel,
          disable_duet: false,
          disable_comment: false,
          disable_stitch: false,
          video_cover_timestamp_ms: 1000,
        },
        source_info: { source: "PULL_FROM_URL", video_url: mediaUrl },
      }),
    });
    const initData = await initRes.json().catch(() => ({}));
    if (!initRes.ok || initData.error?.code === "error") {
      return { ok: false, reason: "publish_error", detail: initData.error?.message || `HTTP ${initRes.status}` };
    }
    return { ok: true, publishId: initData.data?.publish_id, privacyLevel };
  } catch (e) {
    return { ok: false, reason: "publish_error", detail: e.message };
  }
}

export async function checkPublishStatus(publishId) {
  const accessToken = await getValidAccessToken();
  if (!accessToken) return { ok: false, reason: "account_not_connected" };
  const r = await fetch(PUBLISH_STATUS_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ publish_id: publishId }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) return { ok: false, reason: "status_check_failed" };
  return { ok: true, status: data.data?.status };
}
