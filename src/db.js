/**
 * ShieldSync Data Layer — Supabase-ready abstraction
 *
 * Current backend: localStorage (zero-dependency, works offline)
 * Next step: set VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY to
 * switch to a real Postgres backend with row-level security.
 *
 * The interface below is intentionally identical to Supabase's JS client
 * so the swap is a single conditional import, not a rewrite.
 */

// ─── Env detection ───────────────────────────────────────────────
const SB_URL  = import.meta.env.VITE_SUPABASE_URL;
const SB_KEY  = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const HAS_SUPABASE = !!(SB_URL && SB_KEY);
export const HAS_AI_PROXY = true; // /api/ai Edge Function is always deployed

// ─── Tiny localStorage helper ─────────────────────────────────────
const LS = {
  get:  (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set:  (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  del:  (k)    => { try { localStorage.removeItem(k); } catch {} },
};

// ─── Subscriber bus ───────────────────────────────────────────────
// Mimics Supabase Realtime channels for local mode.
// In Supabase mode this is replaced by channel.on('postgres_changes', ...).
const _subs = {};
function _emit(table, payload) {
  (_subs[table] || []).forEach(cb => cb(payload));
}
function _subscribe(table, cb) {
  _subs[table] = _subs[table] || [];
  _subs[table].push(cb);
  return () => { _subs[table] = _subs[table].filter(x => x !== cb); };
}

// ─── Generic CRUD factory (localStorage-backed) ───────────────────
function makeTable(key, seed = []) {
  const read  = ()      => LS.get(key, seed);
  const write = (rows)  => { LS.set(key, rows); _emit(key, rows); return rows; };

  return {
    /** Returns all rows */
    list: () => Promise.resolve(read()),

    /** Returns a single row by id */
    get: (id) => Promise.resolve(read().find(r => r.id === id) ?? null),

    /** Insert a new row (must have .id) */
    insert: (row) => {
      const rows = read();
      if (rows.find(r => r.id === row.id)) return Promise.reject(new Error("Duplicate id"));
      return Promise.resolve(write([row, ...rows])[0]);
    },

    /** Update matching row by id (partial patch) */
    update: (id, patch) => {
      const rows = read().map(r => r.id === id ? { ...r, ...patch } : r);
      write(rows);
      return Promise.resolve(rows.find(r => r.id === id) ?? null);
    },

    /** Delete a row by id */
    remove: (id) => {
      write(read().filter(r => r.id !== id));
      return Promise.resolve();
    },

    /** Subscribe to any change on this table */
    subscribe: (cb) => _subscribe(key, cb),

    /** Seed reset (dev/demo use) */
    reset: (data) => write(data),
  };
}

// ─── Table definitions ────────────────────────────────────────────
// Keys match the Supabase table names we'll create in Phase 2.
export const incidents  = makeTable("ss_db_incidents");
export const officers   = makeTable("ss_db_officers");
export const equipment  = makeTable("ss_db_equipment");
export const leave      = makeTable("ss_db_leave");
export const visitors   = makeTable("ss_db_visitors");
export const scans      = makeTable("ss_db_scans");
export const shifts     = makeTable("ss_db_shifts");

// ─── Audit log (append-only) ──────────────────────────────────────
const AUD_KEY = "ss_audit_v1";
export const audit = {
  log: (user, action, detail = "", opts = {}) => {
    const entries = LS.get(AUD_KEY, []);
    const entry = {
      id:        `A${Date.now()}`,
      ts:        new Date().toISOString(),
      user:      user?.name  ?? "System",
      badge:     user?.badge ?? "—",
      role:      user?.role  ?? "—",
      action,
      detail,
      prevValue: opts.prevValue ?? null,
      newValue:  opts.newValue  ?? null,
    };
    entries.unshift(entry);
    LS.set(AUD_KEY, entries.slice(0, 2000));
    _emit(AUD_KEY, entries);
    return entry;
  },
  list: ()    => Promise.resolve(LS.get(AUD_KEY, [])),
  clear: ()   => { LS.del(AUD_KEY); _emit(AUD_KEY, []); },
  subscribe: (cb) => _subscribe(AUD_KEY, cb),
};

// ─── AI helper ────────────────────────────────────────────────────
// Routes through /api/ai Edge Function (key server-side).
// Falls back to direct browser call for local dev without the proxy.
export async function callAI(messages, system, maxTokens = 1000) {
  const payload = {
    model:      "claude-sonnet-4-6",
    max_tokens: maxTokens,
    system,
    messages,
  };

  // Try proxy first (production path — key is server-side)
  try {
    const res = await fetch("/api/ai", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    });
    if (res.ok) {
      const data = await res.json();
      return data.content?.[0]?.text ?? null;
    }
    // 503 = proxy deployed but key not set → fall through to direct call
    if (res.status !== 503 && res.status !== 404) throw new Error(`Proxy ${res.status}`);
  } catch (e) {
    if (!e.message.includes("Failed to fetch") && !e.message.includes("404")) throw e;
  }

  // Direct browser call (local dev without proxy, or Vercel preview without env var)
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method:  "POST",
    headers: {
      "Content-Type": "application/json",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`${res.status}`);
  const data = await res.json();
  return data.content?.[0]?.text ?? null;
}

// ─── GPS / Geolocation helper ─────────────────────────────────────
export function watchPosition(onUpdate, onError) {
  if (!navigator.geolocation) {
    onError?.(new Error("Geolocation not supported"));
    return () => {};
  }
  const id = navigator.geolocation.watchPosition(
    pos => onUpdate({
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      acc: pos.coords.accuracy,
      ts:  pos.timestamp,
    }),
    err => onError?.(err),
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
  );
  return () => navigator.geolocation.clearWatch(id);
}

// ─── Offline / online detection ───────────────────────────────────
export function onlineStatus(onChange) {
  const h = () => onChange(navigator.onLine);
  window.addEventListener("online",  h);
  window.addEventListener("offline", h);
  return () => {
    window.removeEventListener("online",  h);
    window.removeEventListener("offline", h);
  };
}
