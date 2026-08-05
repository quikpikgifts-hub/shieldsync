// ─────────────────────────────────────────────────────────────────
// Veridian Social — Data Layer
// Same convention as src/db.js: localStorage today, Supabase-ready
// later (see ops/veridian-platform-strategy.md, Task 2's schema).
// Deliberately NOT wired to real Supabase Auth/Postgres yet — that
// requires live project credentials this build doesn't have. This
// layer is what "the founder can log in and create workspaces" runs
// on today; swapping the LS-backed functions below for real API
// calls is the only change needed when those credentials exist.
// ─────────────────────────────────────────────────────────────────

const LS = {
  get: (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  del: (k) => { try { localStorage.removeItem(k); } catch {} },
};

const now = () => new Date().toISOString();
let _seq = Date.now();
const genId = (prefix = "X") => `${prefix}-${(++_seq).toString(36).toUpperCase()}`;

const NS = (col) => `vs_${col}`;

function collection(colName, { scopeKey } = {}) {
  const key = NS(colName);
  const all = () => LS.get(key, []);
  return {
    list: (scopeId) => (scopeId ? all().filter(r => r[scopeKey] === scopeId) : all()),
    get: (id) => all().find(r => r.id === id) || null,
    insert: (data) => {
      const rec = { id: genId(colName[0].toUpperCase()), ...data, createdAt: now(), updatedAt: now() };
      LS.set(key, [...all(), rec]);
      return rec;
    },
    update: (id, changes) => {
      const updated = all().map(r => r.id === id ? { ...r, ...changes, updatedAt: now() } : r);
      LS.set(key, updated);
      return updated.find(r => r.id === id) || null;
    },
    remove: (id) => LS.set(key, all().filter(r => r.id !== id)),
  };
}

// ─── Dev-mode session — NOT production auth ───────────────────────
// Real auth (Supabase Auth, per the platform strategy) needs a live
// project. Until then this is an honest, clearly-labeled stand-in:
// an email identifies a local profile, no password, no server
// verification. It lets the founder (and later, real dev-mode beta
// testers on a trusted link) exercise the whole product today.
const SESSION_KEY = "vs_session";

export const devAuth = {
  signIn: (email, name) => {
    const profile = { email: email.trim().toLowerCase(), name: name?.trim() || email.split("@")[0] };
    LS.set(SESSION_KEY, profile);
    return profile;
  },
  current: () => LS.get(SESSION_KEY, null),
  signOut: () => LS.del(SESSION_KEY),
};

// ─── Workspaces ─────────────────────────────────────────────────
export const workspaces = collection("workspaces");

// ─── Brands (workspace-scoped) ─────────────────────────────────
export const brands = collection("brands", { scopeKey: "workspaceId" });

// ─── Content items — drafts, calendar entries, published posts ──
// status: "draft" -> "approved" | "edited" | "rejected" -> "scheduled" -> "published"
// type: "post" | "video_script"
// Extra fields used but not required by the collection factory: platform,
// scheduledFor (ISO date string), mediaUrl, history (array of prior states).
const _contentItems = collection("content_items", { scopeKey: "brandId" });

export const contentItems = {
  ..._contentItems,
  // Wraps the generic update() so editing a caption doesn't silently lose
  // the previous version — every caption change is appended to history
  // before being overwritten, satisfying "draft history" without every
  // call site having to remember to do it themselves.
  updateWithHistory: (id, changes) => {
    const current = _contentItems.get(id);
    if (!current) return null;
    if (changes.caption !== undefined && changes.caption !== current.caption) {
      const priorEntry = { caption: current.caption, hashtags: current.hashtags, at: current.updatedAt };
      changes = { ...changes, history: [...(current.history || []), priorEntry] };
    }
    return _contentItems.update(id, changes);
  },
};

// Derived — not stored. Counts items awaiting the founder's review.
export function pendingReviewCount(brandId) {
  return contentItems.list(brandId).filter((i) => i.status === "draft").length;
}

// ─── Media library (brand-scoped) ────────────────────────────────
// Link-based for now — real file upload needs Supabase Storage (or
// equivalent), which isn't provisioned. A URL here is exactly what
// publishers' mediaUrl field expects once real publishing is wired up.
export const mediaAssets = collection("media_assets", { scopeKey: "brandId" });

export { genId, now };
