// X (Twitter) API v2 — real implementation, following the same pattern as
// tiktok.js (Sprint 6 of ops/veridian-platform-strategy.md: "replicate the
// same OAuth+publish pattern for a second platform"). Single-tenant by
// design, same as TikTok — one well-known KV key, not a per-user schema;
// revisit once a second real user exists.
//
// PRECONDITIONS beyond env vars, in the X Developer Portal:
//   1. Register an app with OAuth 2.0 enabled, "Confidential client" type,
//      and request the scopes below.
//   2. Set the exact callback URL (X_REDIRECT_URI) in the app's settings —
//      a mismatch fails the callback before it reaches this code.
//   3. Write access (posting) requires a paid API tier as of this writing
//      — verify current X API pricing/access before relying on this; the
//      free tier historically has been read-only.
//
// None of this has been exercised against a live X account — implemented
// against X's documented OAuth 2.0 + PKCE and v2 tweets API shape,
// structurally verified with mocked HTTP calls (see x.test.js), not
// live-tested. Treat the first real attempt as a test.

import { kv } from "../kv.js";
import { CONNECTION_STATES } from "./states.js";

export const platform = "x";
export const requiredEnv = ["X_CLIENT_ID", "X_CLIENT_SECRET", "X_REDIRECT_URI"];
export const requiredScopes = ["tweet.read", "tweet.write", "users.read", "offline.access"];

const TOKEN_KEY = "veridian:social:x:token";
const STATE_KEY_PREFIX = "veridian:social:x:oauth_state:";
const AUTH_BASE = "https://twitter.com/i/oauth2/authorize";
const TOKEN_URL = "https://api.twitter.com/2/oauth2/token";
const TWEETS_URL = "https://api.twitter.com/2/tweets";
const ME_URL = "https://api.twitter.com/2/users/me";

export function isConfigured() {
  return requiredEnv.every((k) => Boolean(process.env[k]));
}

function basicAuthHeader() {
  const raw = `${process.env.X_CLIENT_ID}:${process.env.X_CLIENT_SECRET}`;
  return `Basic ${btoa(raw)}`;
}

function base64UrlEncode(bytes) {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function generateCodeVerifier() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}

export async function generateCodeChallenge(verifier) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return base64UrlEncode(new Uint8Array(digest));
}

// Stores the PKCE verifier keyed by state so the callback (a separate
// request) can retrieve it — mirrors tiktok.js's CSRF-state pattern, with
// the verifier riding along as the stored value instead of a bare flag.
export async function storeOAuthState(state, codeVerifier) {
  await kv("SET", `${STATE_KEY_PREFIX}${state}`, codeVerifier);
  await kv("EXPIRE", `${STATE_KEY_PREFIX}${state}`, 600); // 10 minutes to complete the flow
}

export async function consumeOAuthState(state) {
  const verifier = await kv("GET", `${STATE_KEY_PREFIX}${state}`);
  if (verifier) await kv("DEL", `${STATE_KEY_PREFIX}${state}`);
  return verifier || null;
}

export function buildAuthorizeUrl(state, codeChallenge) {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.X_CLIENT_ID,
    redirect_uri: process.env.X_REDIRECT_URI,
    scope: requiredScopes.join(" "),
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });
  return `${AUTH_BASE}?${params.toString()}`;
}

export async function exchangeCodeForToken(code, codeVerifier) {
  const r = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: basicAuthHeader(),
    },
    body: new URLSearchParams({
      code,
      grant_type: "authorization_code",
      client_id: process.env.X_CLIENT_ID,
      redirect_uri: process.env.X_REDIRECT_URI,
      code_verifier: codeVerifier,
    }).toString(),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok || data.error) throw new Error(data.error_description || data.error || "X token exchange failed");
  return data; // { access_token, expires_in, refresh_token, scope, token_type }
}

async function refreshToken(stored) {
  const r = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: basicAuthHeader(),
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: stored.refresh_token,
      client_id: process.env.X_CLIENT_ID,
    }).toString(),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok || data.error) throw new Error(data.error_description || data.error || "X token refresh failed");
  return data;
}

export async function saveToken(tokenResponse) {
  const previous = await getStoredToken();
  const record = {
    access_token: tokenResponse.access_token,
    refresh_token: tokenResponse.refresh_token || previous?.refresh_token || null,
    scope: tokenResponse.scope,
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
  if (!stored.refresh_token) return null; // no offline.access grant — can't refresh
  try {
    const refreshed = await refreshToken(stored);
    const saved = await saveToken(refreshed);
    return saved.access_token;
  } catch {
    return null; // refresh failed — treat as disconnected rather than throwing mid-publish
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

// Confirms the stored token actually works via /2/users/me, same
// "verified, not merely present" standard as tiktok.js.
export async function verifyConnection() {
  if (!isConfigured()) return { ok: false, reason: "not_configured" };
  const accessToken = await getValidAccessToken();
  if (!accessToken) return { ok: false, reason: "account_not_connected" };

  try {
    const r = await fetch(ME_URL, { headers: { Authorization: `Bearer ${accessToken}` } });
    const data = await r.json().catch(() => ({}));
    if (!r.ok || !data.data?.username) {
      return { ok: false, reason: "verification_failed", detail: data.errors?.[0]?.message || data.detail || `HTTP ${r.status}` };
    }
    const displayName = data.data.name || data.data.username;
    const stored = await getStoredToken();
    if (stored) {
      await kv("SET", TOKEN_KEY, JSON.stringify({ ...stored, last_verified_at: Date.now(), display_name: displayName }));
    }
    return { ok: true, displayName };
  } catch (e) {
    return { ok: false, reason: "verification_failed", detail: e.message };
  }
}

export async function publish({ caption, hashtags }) {
  if (!isConfigured()) return { ok: false, reason: "not_configured", requiredEnv };
  const text = hashtags ? `${caption}\n\n${hashtags}` : caption;
  if (!text || !text.trim()) return { ok: false, reason: "caption_required" };
  if (text.length > 280) return { ok: false, reason: "over_character_limit", length: text.length };

  const accessToken = await getValidAccessToken();
  if (!accessToken) return { ok: false, reason: "account_not_connected" };

  try {
    const r = await fetch(TWEETS_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok || data.errors) {
      return { ok: false, reason: "publish_error", detail: data.errors?.[0]?.message || data.detail || `HTTP ${r.status}` };
    }
    return { ok: true, tweetId: data.data?.id };
  } catch (e) {
    return { ok: false, reason: "publish_error", detail: e.message };
  }
}
