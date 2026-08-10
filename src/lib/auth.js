// Real authentication client — calls this app's own /api/auth/* proxy
// endpoints (never Supabase directly from the browser, matching every other
// third-party integration in this codebase: AI, TikTok, Twilio all go
// through our own API layer). Replaces src/social/store.js's devAuth per
// Sprint 1 of ops/veridian-platform-strategy.md.

const SESSION_KEY = "va_auth_session"; // { access_token, refresh_token, expires_at, user }

function readSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeSession(session) {
  try {
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else localStorage.removeItem(SESSION_KEY);
  } catch { /* localStorage unavailable — session just won't persist across reloads */ }
}

async function call(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  let data;
  try { data = await res.json(); } catch { data = {}; }
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

function toSession(rawSession, user) {
  return {
    access_token: rawSession.access_token,
    refresh_token: rawSession.refresh_token,
    expires_at: Date.now() + (rawSession.expires_in || 3600) * 1000,
    user: user ? { id: user.id, email: user.email } : null,
  };
}

export async function signUp(email, password) {
  const data = await call("/api/auth/signup", { method: "POST", body: JSON.stringify({ email, password }) });
  if (data.session) {
    const session = toSession(data.session, data.user);
    writeSession(session);
    return session;
  }
  // Email confirmation required — honestly report "no session yet" instead
  // of pretending sign-up finished.
  return { needsEmailConfirmation: true, user: data.user, access_token: null };
}

export async function signInWithPassword(email, password) {
  const data = await call("/api/auth/signin", { method: "POST", body: JSON.stringify({ email, password }) });
  const session = toSession(data.session, data.user);
  writeSession(session);
  return session;
}

export async function signOut() {
  const session = readSession();
  if (session?.access_token) {
    await call("/api/auth/signout", { method: "POST", headers: { Authorization: `Bearer ${session.access_token}` } }).catch(() => {});
  }
  writeSession(null);
}

// Returns the current session, transparently refreshing it first if the
// access token is expired or about to be (within 60s) — the standard
// silent-refresh window. Returns null if there's no session, or if the
// refresh token itself is no longer valid (caller should treat as signed out).
export async function getValidSession() {
  let session = readSession();
  if (!session) return null;
  if (session.expires_at - Date.now() > 60_000) return session;
  try {
    const data = await call("/api/auth/refresh", { method: "POST", body: JSON.stringify({ refresh_token: session.refresh_token }) });
    session = toSession(data.session, data.user || session.user);
    writeSession(session);
    return session;
  } catch {
    writeSession(null);
    return null;
  }
}

// Fetches (and, on first call after signup, triggers server-side
// auto-provisioning of) the signed-in user's organizations.
export async function fetchOrganizations(accessToken) {
  return call("/api/auth/session", { headers: { Authorization: `Bearer ${accessToken}` } });
}
