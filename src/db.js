// ─────────────────────────────────────────────────────────────────
// OperaCore 2030 — Multi-Tenant Data Layer
// localStorage today → Supabase tomorrow (identical API surface)
// All keys namespaced: oc_{tenantId}_{collection}
// ─────────────────────────────────────────────────────────────────

const LS = {
  get: (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  del: (k) => { try { localStorage.removeItem(k); } catch {} },
};

const NS = (tenantId, col) => `oc_${tenantId}_${col}`;
const now = () => new Date().toISOString();
let _seq = Date.now();
const genId = (prefix = "X") => `${prefix}-${(++_seq).toString(36).toUpperCase()}`;

// ─── Tenant-scoped collection factory ────────────────────────────
function collection(tenantId, colName) {
  const key = NS(tenantId, colName);
  return {
    list: () => LS.get(key, []),
    get: (id) => LS.get(key, []).find(r => r.id === id) || null,
    insert: (data) => {
      const rec = { id: genId(colName[0].toUpperCase()), tenantId, ...data, createdAt: now(), updatedAt: now() };
      LS.set(key, [...LS.get(key, []), rec]);
      return rec;
    },
    update: (id, changes) => {
      const updated = LS.get(key, []).map(r => r.id === id ? { ...r, ...changes, updatedAt: now() } : r);
      LS.set(key, updated);
      return updated.find(r => r.id === id);
    },
    upsert: (data) => {
      const list = LS.get(key, []);
      const idx = list.findIndex(r => r.id === data.id);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...data, updatedAt: now() };
        LS.set(key, list);
        return list[idx];
      }
      return collection(tenantId, colName).insert(data);
    },
    remove: (id) => { LS.set(key, LS.get(key, []).filter(r => r.id !== id)); },
    clear: () => LS.del(key),
    count: () => LS.get(key, []).length,
  };
}

// ─── Platform-level collections ───────────────────────────────────
const PLATFORM_KEY = "oc_platform";
export const platform = {
  tenants: {
    list: () => LS.get(`${PLATFORM_KEY}_tenants`, []),
    get: (id) => LS.get(`${PLATFORM_KEY}_tenants`, []).find(t => t.id === id) || null,
    getBySlug: (slug) => LS.get(`${PLATFORM_KEY}_tenants`, []).find(t => t.slug === slug) || null,
    insert: (data) => {
      const t = { id: genId("T"), ...data, createdAt: now(), updatedAt: now() };
      LS.set(`${PLATFORM_KEY}_tenants`, [...LS.get(`${PLATFORM_KEY}_tenants`, []), t]);
      return t;
    },
    update: (id, changes) => {
      const updated = LS.get(`${PLATFORM_KEY}_tenants`, []).map(t => t.id === id ? { ...t, ...changes, updatedAt: now() } : t);
      LS.set(`${PLATFORM_KEY}_tenants`, updated);
    },
    remove: (id) => LS.set(`${PLATFORM_KEY}_tenants`, LS.get(`${PLATFORM_KEY}_tenants`, []).filter(t => t.id !== id)),
  },
  users: {
    list: () => LS.get(`${PLATFORM_KEY}_users`, []),
    get: (id) => LS.get(`${PLATFORM_KEY}_users`, []).find(u => u.id === id) || null,
    getByEmail: (email) => LS.get(`${PLATFORM_KEY}_users`, []).find(u => u.email.toLowerCase() === email.toLowerCase()) || null,
    insert: (data) => {
      const u = { id: genId("U"), ...data, createdAt: now() };
      LS.set(`${PLATFORM_KEY}_users`, [...LS.get(`${PLATFORM_KEY}_users`, []), u]);
      return u;
    },
    update: (id, changes) => {
      const updated = LS.get(`${PLATFORM_KEY}_users`, []).map(u => u.id === id ? { ...u, ...changes } : u);
      LS.set(`${PLATFORM_KEY}_users`, updated);
    },
    byTenant: (tenantId) => LS.get(`${PLATFORM_KEY}_users`, []).filter(u => u.tenantId === tenantId),
  },
  audit: {
    log: (userId, tenantId, action, detail = "") => {
      const logs = LS.get(`${PLATFORM_KEY}_audit`, []);
      logs.unshift({ id: genId("A"), userId, tenantId, action, detail, ts: now() });
      LS.set(`${PLATFORM_KEY}_audit`, logs.slice(0, 1000));
    },
    list: (tenantId) => {
      const logs = LS.get(`${PLATFORM_KEY}_audit`, []);
      return tenantId ? logs.filter(l => l.tenantId === tenantId) : logs;
    },
  },
};

// ─── Tenant-scoped DB factory ──────────────────────────────────────
export function tenantDB(tenantId) {
  return {
    // CRM
    leads:         collection(tenantId, "leads"),
    contacts:      collection(tenantId, "contacts"),
    opportunities: collection(tenantId, "opportunities"),
    activities:    collection(tenantId, "activities"),
    // Clients (post-conversion accounts)
    clients:       collection(tenantId, "clients"),
    // Operations
    projects:      collection(tenantId, "projects"),
    tasks:         collection(tenantId, "tasks"),
    milestones:    collection(tenantId, "milestones"),
    // People
    employees:     collection(tenantId, "employees"),
    // Compliance & Risk
    risks:         collection(tenantId, "risks"),
    compliancePrograms: collection(tenantId, "compliance_programs"),
    incidents:     collection(tenantId, "incidents"),
    // Finance
    financials:    collection(tenantId, "financials"),
    invoices:      collection(tenantId, "invoices"),
    // Outreach
    appointments:  collection(tenantId, "appointments"),
    drafts:        collection(tenantId, "drafts"),
    // Knowledge
    documents:     collection(tenantId, "documents"),
    // Approvals
    approvals:     collection(tenantId, "approvals"),
    notes:         collection(tenantId, "notes"),
    settings: {
      get: () => LS.get(NS(tenantId, "settings"), {}),
      set: (data) => LS.set(NS(tenantId, "settings"), { ...LS.get(NS(tenantId, "settings"), {}), ...data }),
    },
    aiMemory: {
      get: (key) => LS.get(NS(tenantId, `ai_${key}`), []),
      set: (key, msgs) => LS.set(NS(tenantId, `ai_${key}`), msgs.slice(-100)),
      clear: (key) => LS.del(NS(tenantId, `ai_${key}`)),
    },
  };
}

// ─── Session management ───────────────────────────────────────────
const SESSION_KEY = "oc_session_v2";
const SESSION_TTL = 8 * 60 * 60 * 1000;

export const session = {
  save: (data) => LS.set(SESSION_KEY, { ...data, exp: Date.now() + SESSION_TTL }),
  load: () => {
    const s = LS.get(SESSION_KEY, null);
    if (!s || Date.now() > s.exp) { LS.del(SESSION_KEY); return null; }
    return s;
  },
  clear: () => LS.del(SESSION_KEY),
  refresh: () => {
    const s = LS.get(SESSION_KEY, null);
    if (s) LS.set(SESSION_KEY, { ...s, exp: Date.now() + SESSION_TTL });
  },
};

// ─── AI proxy ────────────────────────────────────────────────────
export async function callAI(messages, systemPrompt, maxTokens = 800) {
  const resp = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, system: systemPrompt, max_tokens: maxTokens }),
  });
  if (!resp.ok) throw new Error(`AI error ${resp.status}`);
  const data = await resp.json();
  if (data.error) throw new Error(data.error);
  return data.text;
}

export { LS, genId, now };
