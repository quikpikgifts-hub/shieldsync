// Pinterest API v5 — real OAuth+publish, same pattern as tiktok.js/x.js.
// The one Pinterest-specific wrinkle: every pin needs a board_id, which
// isn't known until after connecting — verifyConnection() (called
// automatically right after the OAuth callback, same as LinkedIn/YouTube)
// fetches the account's boards and stores the first one as the default,
// overridable via PINTEREST_BOARD_ID if the founder has more than one
// board and wants a specific one.
//
// PRECONDITIONS beyond env vars, in the Pinterest Developer Portal:
//   1. Register an app; trial API access is heavily rate-limited — expect
//      to need to apply for standard access before relying on this at
//      any real volume.
//   2. Add the exact redirect URI (PINTEREST_REDIRECT_URI).
//   3. The connected account needs at least one board to pin to (or set
//      PINTEREST_BOARD_ID to one you've already created).
//
// Not live-tested — implemented against Pinterest's documented API v5
// shape, verified with mocked HTTP calls (see pinterest.test.js).

import { kv } from "../kv.js";
import { CONNECTION_STATES } from "./states.js";

export const platform = "pinterest";
export const requiredEnv = ["PINTEREST_CLIENT_ID", "PINTEREST_CLIENT_SECRET", "PINTEREST_REDIRECT_URI"];
export const requiredScopes = ["boards:read", "pins:read", "pins:write"];

const TOKEN_KEY = "veridian:social:pinterest:token";
const STATE_KEY_PREFIX = "veridian:social:pinterest:oauth_state:";
const AUTH_BASE = "https://www.pinterest.com/oauth/";
const TOKEN_URL = "https://api.pinterest.com/v5/oauth/token";
const BOARDS_URL = "https://api.pinterest.com/v5/boards";
const USER_ACCOUNT_URL = "https://api.pinterest.com/v5/user_account";
const PINS_URL = "https://api.pinterest.com/v5/pins";

export function isConfigured() {
  return requiredEnv.every((k) => Boolean(process.env[k]));
}

function basicAuthHeader() {
  return `Basic ${btoa(`${process.env.PINTEREST_CLIENT_ID}:${process.env.PINTEREST_CLIENT_SECRET}`)}`;
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
    client_id: process.env.PINTEREST_CLIENT_ID,
    redirect_uri: process.env.PINTEREST_REDIRECT_URI,
    scope: requiredScopes.join(","),
    state,
  });
  return `${AUTH_BASE}?${params.toString()}`;
}

export async function exchangeCodeForToken(code) {
  const r = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: basicAuthHeader() },
    body: new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: process.env.PINTEREST_REDIRECT_URI }).toString(),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok || data.error) throw new Error(data.message || data.error_description || data.error || "Pinterest token exchange failed");
  return data; // { access_token, refresh_token, expires_in, scope, token_type }
}

async function refreshToken(stored) {
  const r = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: basicAuthHeader() },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: stored.refresh_token }).toString(),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok || data.error) throw new Error(data.message || data.error_description || data.error || "Pinterest token refresh failed");
  return data;
}

export async function saveToken(tokenResponse, extra = {}) {
  const previous = await getStoredToken();
  const record = {
    access_token: tokenResponse.access_token,
    refresh_token: tokenResponse.refresh_token || previous?.refresh_token || null,
    expires_at: Date.now() + (tokenResponse.expires_in || 0) * 1000,
    board_id: extra.boardId ?? previous?.board_id ?? null,
    last_verified_at: previous?.last_verified_at ?? null,
    display_name: extra.displayName ?? previous?.display_name ?? null,
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

// Confirms the token works, and (re-)discovers which board to pin to:
// PINTEREST_BOARD_ID if set, otherwise the account's first board.
export async function verifyConnection() {
  if (!isConfigured()) return { ok: false, reason: "not_configured" };
  const accessToken = await getValidAccessToken();
  if (!accessToken) return { ok: false, reason: "account_not_connected" };

  try {
    const accountRes = await fetch(USER_ACCOUNT_URL, { headers: { Authorization: `Bearer ${accessToken}` } });
    const accountData = await accountRes.json().catch(() => ({}));
    if (!accountRes.ok || !accountData.username) {
      return { ok: false, reason: "verification_failed", detail: accountData.message || `HTTP ${accountRes.status}` };
    }

    let boardId = process.env.PINTEREST_BOARD_ID || null;
    if (!boardId) {
      const boardsRes = await fetch(BOARDS_URL, { headers: { Authorization: `Bearer ${accessToken}` } });
      const boardsData = await boardsRes.json().catch(() => ({}));
      boardId = boardsData.items?.[0]?.id || null;
    }

    const stored = await getStoredToken();
    if (stored) {
      await kv("SET", TOKEN_KEY, JSON.stringify({ ...stored, last_verified_at: Date.now(), display_name: accountData.username, board_id: boardId }));
    }
    return { ok: true, displayName: accountData.username, boardId };
  } catch (e) {
    return { ok: false, reason: "verification_failed", detail: e.message };
  }
}

export async function publish({ caption, hashtags, mediaUrl }) {
  if (!isConfigured()) return { ok: false, reason: "not_configured", requiredEnv };
  if (!mediaUrl) return { ok: false, reason: "media_required" }; // Pinterest pins require an image

  const accessToken = await getValidAccessToken();
  if (!accessToken) return { ok: false, reason: "account_not_connected" };

  const stored = await getStoredToken();
  const boardId = process.env.PINTEREST_BOARD_ID || stored?.board_id;
  if (!boardId) return { ok: false, reason: "board_required" }; // needs at least one verifyConnection() to learn a board

  const description = hashtags ? `${caption}\n\n${hashtags}` : caption;

  try {
    const r = await fetch(PINS_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        board_id: boardId,
        title: (caption || "").slice(0, 100),
        description: description || "",
        media_source: { source_type: "image_url", url: mediaUrl },
      }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok || !data.id) {
      return { ok: false, reason: "publish_error", detail: data.message || `HTTP ${r.status}` };
    }
    return { ok: true, pinId: data.id };
  } catch (e) {
    return { ok: false, reason: "publish_error", detail: e.message };
  }
}
