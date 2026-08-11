// YouTube Data API v3 — video upload (Shorts is just a vertical <60s
// video, same upload path). Real OAuth+publish, same pattern as
// tiktok.js/x.js, with one real structural difference: YouTube's upload
// API has no "pull from URL" option like TikTok/Instagram — the video
// bytes must be PUT directly by the caller. publish() here fetches
// `mediaUrl` server-side and streams the response body straight into
// YouTube's resumable-upload PUT (no full-file buffering), rather than
// loading the whole video into memory first.
//
// PRECONDITIONS beyond env vars, in Google Cloud Console:
//   1. Enable the YouTube Data API v3 on the project.
//   2. Configure the OAuth consent screen; the youtube.upload scope is
//      sensitive and Google reviews it before allowing non-test users.
//   3. Add the exact redirect URI (GOOGLE_REDIRECT_URI) as an authorized
//      redirect URI on the OAuth client.
//   4. Uploads default to `privacyStatus: "private"` (override with
//      YOUTUBE_PRIVACY_STATUS) — same "don't post publicly until you've
//      verified it works" caution as TikTok's SELF_ONLY default.
//
// Not live-tested — implemented against Google's documented OAuth2 +
// resumable-upload API shape, verified with mocked HTTP calls (see
// youtube.test.js), not live-tested.

import { kv } from "../kv.js";
import { CONNECTION_STATES } from "./states.js";

export const platform = "youtube";
export const requiredEnv = ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_REDIRECT_URI"];
export const requiredScopes = ["https://www.googleapis.com/auth/youtube.upload"];

const TOKEN_KEY = "veridian:social:youtube:token";
const STATE_KEY_PREFIX = "veridian:social:youtube:oauth_state:";
const AUTH_BASE = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const CHANNELS_URL = "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true";
const UPLOAD_URL = "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status";

export function isConfigured() {
  return requiredEnv.every((k) => Boolean(process.env[k]));
}

export async function storeOAuthState(state) {
  await kv("SET", `${STATE_KEY_PREFIX}${state}`, "1");
  await kv("EXPIRE", `${STATE_KEY_PREFIX}${state}`, 600);
}

export async function consumeOAuthState(state) {
  const found = await kv("GET", `${STATE_KEY_PREFIX}${state}`);
  if (found) await kv("DEL", `${STATE_KEY_PREFIX}${state}`);
  return Boolean(found);
}

export function buildAuthorizeUrl(state) {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI,
    scope: requiredScopes.join(" "),
    state,
    access_type: "offline", // required to receive a refresh_token
    prompt: "consent", // forces re-consent so a refresh_token is issued even on a repeat connect
  });
  return `${AUTH_BASE}?${params.toString()}`;
}

export async function exchangeCodeForToken(code) {
  const r = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
    }).toString(),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok || data.error) throw new Error(data.error_description || data.error || "Google token exchange failed");
  return data; // { access_token, expires_in, refresh_token?, scope, token_type }
}

async function refreshToken(stored) {
  const r = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: stored.refresh_token,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
    }).toString(),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok || data.error) throw new Error(data.error_description || data.error || "Google token refresh failed");
  return data;
}

export async function saveToken(tokenResponse) {
  const previous = await getStoredToken();
  const record = {
    access_token: tokenResponse.access_token,
    refresh_token: tokenResponse.refresh_token || previous?.refresh_token || null,
    expires_at: Date.now() + (tokenResponse.expires_in || 0) * 1000,
    last_verified_at: previous?.last_verified_at ?? null,
    display_name: previous?.display_name ?? null,
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

async function getValidAccessToken() {
  const stored = await getStoredToken();
  if (!stored) return null;
  const expiresInMs = stored.expires_at - Date.now();
  if (expiresInMs > 5 * 60 * 1000) return stored.access_token;
  if (!stored.refresh_token) return null;
  try {
    const refreshed = await refreshToken(stored);
    const saved = await saveToken(refreshed);
    return saved.access_token;
  } catch {
    return null;
  }
}

export async function getConnectionState() {
  if (!isConfigured()) return { state: CONNECTION_STATES.WAITING_FOR_CREDENTIALS };
  const token = await getValidAccessToken();
  if (!token) return { state: CONNECTION_STATES.READY_TO_ACTIVATE };
  const stored = await getStoredToken();
  return {
    state: CONNECTION_STATES.CONNECTED,
    lastVerifiedAt: stored?.last_verified_at || null,
    displayName: stored?.display_name || null,
  };
}

export async function verifyConnection() {
  if (!isConfigured()) return { ok: false, reason: "not_configured" };
  const accessToken = await getValidAccessToken();
  if (!accessToken) return { ok: false, reason: "account_not_connected" };

  try {
    const r = await fetch(CHANNELS_URL, { headers: { Authorization: `Bearer ${accessToken}` } });
    const data = await r.json().catch(() => ({}));
    const channelTitle = data.items?.[0]?.snippet?.title;
    if (!r.ok || !channelTitle) {
      return { ok: false, reason: "verification_failed", detail: data.error?.message || `HTTP ${r.status}` };
    }
    const stored = await getStoredToken();
    if (stored) {
      await kv("SET", TOKEN_KEY, JSON.stringify({ ...stored, last_verified_at: Date.now(), display_name: channelTitle }));
    }
    return { ok: true, displayName: channelTitle };
  } catch (e) {
    return { ok: false, reason: "verification_failed", detail: e.message };
  }
}

export async function publish({ caption, hashtags, mediaUrl }) {
  if (!isConfigured()) return { ok: false, reason: "not_configured", requiredEnv };
  if (!mediaUrl) return { ok: false, reason: "media_required" };

  const accessToken = await getValidAccessToken();
  if (!accessToken) return { ok: false, reason: "account_not_connected" };

  // YouTube needs the file size and content-type up front to initiate a
  // resumable upload session — HEAD the media URL rather than assuming.
  let contentLength, contentType;
  try {
    const headRes = await fetch(mediaUrl, { method: "HEAD" });
    if (!headRes.ok) return { ok: false, reason: "media_fetch_failed", detail: `HTTP ${headRes.status}` };
    contentLength = headRes.headers.get("content-length");
    contentType = headRes.headers.get("content-type") || "video/*";
    if (!contentLength) return { ok: false, reason: "media_fetch_failed", detail: "media URL did not report a Content-Length" };
  } catch (e) {
    return { ok: false, reason: "media_fetch_failed", detail: e.message };
  }

  const description = hashtags ? `${caption}\n\n${hashtags}` : caption;
  const privacyStatus = process.env.YOUTUBE_PRIVACY_STATUS || "private";

  try {
    const initRes = await fetch(UPLOAD_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Upload-Content-Type": contentType,
        "X-Upload-Content-Length": contentLength,
      },
      body: JSON.stringify({
        snippet: { title: (caption || "").slice(0, 100) || "Untitled", description: description || "" },
        status: { privacyStatus },
      }),
    });
    if (!initRes.ok) {
      const data = await initRes.json().catch(() => ({}));
      return { ok: false, reason: "publish_error", detail: data.error?.message || `HTTP ${initRes.status}` };
    }
    const uploadUrl = initRes.headers.get("location");
    if (!uploadUrl) return { ok: false, reason: "publish_error", detail: "YouTube did not return a resumable upload URL" };

    const mediaRes = await fetch(mediaUrl);
    if (!mediaRes.ok || !mediaRes.body) {
      return { ok: false, reason: "media_fetch_failed", detail: `HTTP ${mediaRes.status}` };
    }

    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": contentType, "Content-Length": contentLength },
      body: mediaRes.body, // streamed, not buffered — avoids holding the whole video in memory
    });
    const uploadData = await uploadRes.json().catch(() => ({}));
    if (!uploadRes.ok || !uploadData.id) {
      return { ok: false, reason: "publish_error", detail: uploadData.error?.message || `HTTP ${uploadRes.status}` };
    }
    return { ok: true, videoId: uploadData.id, privacyStatus };
  } catch (e) {
    return { ok: false, reason: "publish_error", detail: e.message };
  }
}
