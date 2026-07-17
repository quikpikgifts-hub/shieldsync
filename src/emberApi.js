// Thin fetch wrapper for the real Ember backend (backend/). No mock data, no simulated
// responses — every function here makes a real HTTP request and throws on failure.
//
// Token handling: the access token lives only in memory (a module-level variable, not
// localStorage) to limit its exposure if an XSS bug ever landed; the refresh token is
// opaque and long-lived, so it's persisted in localStorage to survive a page reload,
// with a session-restore attempt on boot (see restoreSession()). This is a real, if
// imperfect, tradeoff — an httpOnly-cookie-based refresh flow would be stronger and is
// worth revisiting before any real deployment (see docs/ember/OPEN_DECISIONS.md).

const API_BASE = import.meta.env.VITE_EMBER_API_URL || "http://localhost:3001";
const REFRESH_TOKEN_KEY = "ember_refresh_token";

let accessToken = null;

export class ApiError extends Error {
  constructor(status, message) {
    super(Array.isArray(message) ? message.join(", ") : message);
    this.status = status;
  }
}

export class AuthRequiredError extends Error {
  constructor() {
    super("Your session has expired. Please log in again.");
  }
}

function getStoredRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

function storeTokens({ accessToken: newAccessToken, refreshToken }) {
  accessToken = newAccessToken;
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

function clearTokens() {
  accessToken = null;
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

async function rawRequest(path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth && accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null;

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(res.status, data?.message ?? `Request failed with status ${res.status}`);
  }
  return data;
}

let refreshInFlight = null;

async function refreshAccessToken() {
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) throw new AuthRequiredError();

  // Coalesce concurrent refresh attempts (e.g. two requests 401 at once) into one call —
  // the backend's refresh-token rotation means a second concurrent call would otherwise
  // race against the first and get rejected as token reuse.
  if (!refreshInFlight) {
    refreshInFlight = rawRequest("/auth/refresh", { method: "POST", body: { refreshToken }, auth: false })
      .then((data) => {
        storeTokens(data);
        return data;
      })
      .catch((err) => {
        clearTokens();
        throw err instanceof ApiError ? new AuthRequiredError() : err;
      })
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

async function request(path, options = {}) {
  try {
    return await rawRequest(path, options);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401 && options.auth !== false) {
      await refreshAccessToken();
      return rawRequest(path, options);
    }
    throw err;
  }
}

// ── Auth ──────────────────────────────────────────────────────
export async function register({ email, password, dateOfBirth, phone }) {
  const data = await rawRequest("/auth/register", { method: "POST", body: { email, password, dateOfBirth, phone }, auth: false });
  storeTokens(data.tokens);
  return data.user;
}

export async function login({ email, password }) {
  const data = await rawRequest("/auth/login", { method: "POST", body: { email, password }, auth: false });
  storeTokens(data.tokens);
  return data.user;
}

export async function logout() {
  const refreshToken = getStoredRefreshToken();
  if (refreshToken) {
    await rawRequest("/auth/logout", { method: "POST", body: { refreshToken } }).catch(() => {});
  }
  clearTokens();
}

/** Attempts to restore a session from the persisted refresh token. Called once on app boot. */
export async function restoreSession() {
  if (!getStoredRefreshToken()) return null;
  await refreshAccessToken();
  return getMe();
}

export function isLoggedIn() {
  return accessToken !== null;
}

// ── Users ─────────────────────────────────────────────────────
export const getMe = () => request("/users/me");

// ── Profiles ──────────────────────────────────────────────────
export const getMyProfile = () => request("/profiles/me");
export const upsertProfile = (body) => request("/profiles/me", { method: "PUT", body });
export const getMyPreferences = () => request("/profiles/me/preferences");
export const upsertPreferences = (body) => request("/profiles/me/preferences", { method: "PUT", body });
export const upsertPromptAnswers = (answers) => request("/profiles/me/prompt-answers", { method: "PUT", body: { answers } });

export const getProfile = (userId) => request(`/profiles/${userId}`);

// ── Matching ──────────────────────────────────────────────────
export const listCandidates = () => request("/matching/candidates");
export const decide = (targetId, action) => request("/matching/likes", { method: "POST", body: { targetId, action } });
export const listMatches = () => request("/matching/matches");
export const listLikesReceived = () => request("/matching/likes/received");

// ── Messaging ─────────────────────────────────────────────────
export const listMessages = (matchId) => request(`/conversations/${matchId}/messages`);
export const sendMessage = (matchId, body) => request(`/conversations/${matchId}/messages`, { method: "POST", body });

// ── Safety ────────────────────────────────────────────────────
export const createReport = (body) => request("/reports", { method: "POST", body });
export const createBlock = (blockedId) => request("/blocks", { method: "POST", body: { blockedId } });
