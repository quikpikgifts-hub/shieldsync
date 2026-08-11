// LinkedIn — Sign In with LinkedIn (OpenID Connect) + the Posts API. Real
// implementation, following the same OAuth+publish pattern as tiktok.js
// and x.js. Single-tenant by design, same as those two.
//
// PRECONDITIONS beyond env vars, in the LinkedIn Developer Portal:
//   1. Create an app, request the "Sign In with LinkedIn using OpenID
//      Connect" and "Share on LinkedIn" products — both require approval
//      before requiredScopes below are grantable.
//   2. Add the exact redirect URL (LINKEDIN_REDIRECT_URI) under
//      OAuth 2.0 settings.
//   3. Standard LinkedIn access tokens last ~60 days and are NOT
//      refreshable unless your app has been separately approved for
//      "Programmatic refresh tokens" — this code refreshes opportunistically
//      when a refresh_token is present and otherwise degrades to
//      account_not_connected once the token expires, same as X's
//      no-offline-access case.
//
// Not live-tested — implemented against LinkedIn's documented OIDC +
// Posts API (LinkedIn-Version header, /rest/posts) shape, verified with
// mocked HTTP calls (see linkedin.test.js), not live-tested.

import { kv } from "../kv.js";
import { CONNECTION_STATES } from "./states.js";

export const platform = "linkedin";
export const requiredEnv = ["LINKEDIN_CLIENT_ID", "LINKEDIN_CLIENT_SECRET", "LINKEDIN_REDIRECT_URI"];
export const requiredScopes = ["w_member_social", "openid", "profile"];

const TOKEN_KEY = "veridian:social:linkedin:token";
const STATE_KEY_PREFIX = "veridian:social:linkedin:oauth_state:";
const AUTH_BASE = "https://www.linkedin.com/oauth/v2/authorization";
const TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken";
const USERINFO_URL = "https://api.linkedin.com/v2/userinfo";
const POSTS_URL = "https://api.linkedin.com/rest/posts";
const API_VERSION = "202401"; // LinkedIn requires a dated version header — verify this is still current before relying on it.

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
    client_id: process.env.LINKEDIN_CLIENT_ID,
    redirect_uri: process.env.LINKEDIN_REDIRECT_URI,
    scope: requiredScopes.join(" "),
    state,
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
      redirect_uri: process.env.LINKEDIN_REDIRECT_URI,
      client_id: process.env.LINKEDIN_CLIENT_ID,
      client_secret: process.env.LINKEDIN_CLIENT_SECRET,
    }).toString(),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok || data.error) throw new Error(data.error_description || data.error || "LinkedIn token exchange failed");
  return data; // { access_token, expires_in, refresh_token?, scope, id_token }
}

async function refreshToken(stored) {
  const r = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: stored.refresh_token,
      client_id: process.env.LINKEDIN_CLIENT_ID,
      client_secret: process.env.LINKEDIN_CLIENT_SECRET,
    }).toString(),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok || data.error) throw new Error(data.error_description || data.error || "LinkedIn token refresh failed");
  return data;
}

async function fetchUserInfo(accessToken) {
  const r = await fetch(USERINFO_URL, { headers: { Authorization: `Bearer ${accessToken}` } });
  const data = await r.json().catch(() => ({}));
  if (!r.ok || !data.sub) throw new Error(data.message || `HTTP ${r.status}`);
  return data; // { sub, name, ... } — "sub" is the member ID used to build the author URN
}

export async function saveToken(tokenResponse, extra = {}) {
  const previous = await getStoredToken();
  const record = {
    access_token: tokenResponse.access_token,
    refresh_token: tokenResponse.refresh_token || previous?.refresh_token || null,
    expires_at: Date.now() + (tokenResponse.expires_in || 0) * 1000,
    author_urn: extra.authorUrn ?? previous?.author_urn ?? null,
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
  if (!stored.refresh_token) return null; // standard tokens aren't refreshable without special approval — see header comment
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
    const info = await fetchUserInfo(accessToken);
    const stored = await getStoredToken();
    if (stored) {
      await kv("SET", TOKEN_KEY, JSON.stringify({ ...stored, last_verified_at: Date.now(), display_name: info.name || null, author_urn: `urn:li:person:${info.sub}` }));
    }
    return { ok: true, displayName: info.name || null };
  } catch (e) {
    return { ok: false, reason: "verification_failed", detail: e.message };
  }
}

export async function publish({ caption, hashtags }) {
  if (!isConfigured()) return { ok: false, reason: "not_configured", requiredEnv };
  const text = hashtags ? `${caption}\n\n${hashtags}` : caption;
  if (!text || !text.trim()) return { ok: false, reason: "caption_required" };

  const accessToken = await getValidAccessToken();
  if (!accessToken) return { ok: false, reason: "account_not_connected" };

  const stored = await getStoredToken();
  const authorUrn = stored?.author_urn;
  if (!authorUrn) return { ok: false, reason: "account_not_connected" }; // needs at least one verifyConnection() to learn the author URN

  try {
    const r = await fetch(POSTS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "LinkedIn-Version": API_VERSION,
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify({
        author: authorUrn,
        commentary: text,
        visibility: "PUBLIC",
        distribution: { feedDistribution: "MAIN_FEED", targetEntities: [], thirdPartyDistributionChannels: [] },
        lifecycleState: "PUBLISHED",
        isReshareDisabledByAuthor: false,
      }),
    });
    if (!r.ok) {
      const data = await r.json().catch(() => ({}));
      return { ok: false, reason: "publish_error", detail: data.message || `HTTP ${r.status}` };
    }
    // The Posts API returns the new post's URN in the x-restli-id header, not the body.
    const postId = r.headers.get("x-restli-id") || null;
    return { ok: true, postId };
  } catch (e) {
    return { ok: false, reason: "publish_error", detail: e.message };
  }
}
