import React, { useState, useEffect, useMemo } from "react";
import { CheckCircle, X, Sparkles, Calendar, BarChart2, Settings, LogOut, Plus, Send, Edit3, ThumbsDown, ThumbsUp, Clock, Zap, Film, Image as ImageIcon, History, CalendarClock, Bell } from "lucide-react";
import { devAuth, workspaces, brands, contentItems, mediaAssets, pendingReviewCount } from "./social/store.js";

// ─────────────────────────────────────────────────────────────
// Design tokens — same system as App.jsx/Website.jsx, own palette
// ─────────────────────────────────────────────────────────────
const S = {
  bg: "#0A0A12", surface: "#0F0F1A", card: "#151522", cardH: "#1B1B2C",
  border: "#232336", borderH: "#33334A",
  accent: "#8B5CF6", accentH: "#7C3AED", accentB: "rgba(139,92,246,0.14)",
  green: "#10B981", greenB: "rgba(16,185,129,0.14)",
  amber: "#F59E0B", amberB: "rgba(245,158,11,0.14)",
  red: "#EF4444", redB: "rgba(239,68,68,0.14)",
  text: "#F1F0FA", textSub: "#8B8AA8", textDim: "#4A4A64",
};

const SCSS = `*{box-sizing:border-box;margin:0;padding:0}body{background:${S.bg};color:${S.text};font-family:-apple-system,BlinkMacSystemFont,'Inter','Segoe UI',sans-serif;-webkit-font-smoothing:antialiased}input,textarea,button,select{font-family:inherit}::-webkit-scrollbar{width:6px}::-webkit-scrollbar-thumb{background:${S.border};border-radius:3px}`;

function useInjectedStyle(css) {
  useEffect(() => {
    const el = document.createElement("style");
    el.textContent = css;
    document.head.appendChild(el);
    return () => el.remove();
  }, [css]);
}

const PLATFORMS = [
  { key: "general", label: "General / unspecified" },
  { key: "instagram", label: "Instagram" },
  { key: "facebook", label: "Facebook" },
  { key: "tiktok", label: "TikTok" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "youtube", label: "YouTube" },
  { key: "x", label: "X" },
  { key: "pinterest", label: "Pinterest" },
];

// ─── Primitives ─────────────────────────────────────────────────
const Btn = ({ children, onClick, variant = "primary", disabled, style, type = "button" }) => {
  const variants = {
    primary: { background: S.accent, color: "#fff", border: "none" },
    ghost: { background: "transparent", color: S.text, border: `1px solid ${S.border}` },
    danger: { background: S.redB, color: S.red, border: `1px solid ${S.red}33` },
    success: { background: S.greenB, color: S.green, border: `1px solid ${S.green}33` },
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      style={{ ...variants[variant], borderRadius: 8, padding: "9px 16px", fontSize: 13.5, fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1, display: "inline-flex",
        alignItems: "center", gap: 6, transition: "opacity .15s", ...style }}>
      {children}
    </button>
  );
};

const Card = ({ children, style }) => (
  <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 14, padding: 20, ...style }}>{children}</div>
);

const Field = ({ label, children }) => (
  <label style={{ display: "block", marginBottom: 14 }}>
    <div style={{ fontSize: 12, fontWeight: 600, color: S.textSub, marginBottom: 6 }}>{label}</div>
    {children}
  </label>
);

const inputStyle = { width: "100%", background: S.surface, border: `1px solid ${S.border}`, borderRadius: 8, padding: "10px 12px", color: S.text, fontSize: 14, outline: "none" };

const Pill = ({ children, tone = "textSub" }) => {
  const bg = { green: S.greenB, amber: S.amberB, red: S.redB, accent: S.accentB, textSub: "transparent" }[tone];
  const fg = { green: S.green, amber: S.amber, red: S.red, accent: S.accent, textSub: S.textSub }[tone];
  return <span style={{ background: bg, color: fg, fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 999, letterSpacing: ".02em" }}>{children}</span>;
};

const STATUS_TONE = { draft: "textSub", approved: "green", edited: "accent", rejected: "red", scheduled: "amber", published: "green" };

// ─── AI + publish calls ───────────────────────────────────────────
async function safeJson(r) {
  try {
    return await r.json();
  } catch {
    // Non-JSON response — most commonly means /api/* isn't being served at
    // all (e.g. running `vite dev` directly instead of `vercel dev`, or the
    // route isn't deployed yet), not an application error.
    return null;
  }
}

async function generate(agent, input) {
  const r = await fetch("/api/social/generate", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ agent, input }),
  });
  const data = await safeJson(r);
  if (!data) throw new Error("AI generation endpoint didn't respond as expected — is the API layer running?");
  if (!r.ok) throw new Error(data.error || "Generation failed");
  return data;
}

async function attemptPublish(platform, item) {
  const r = await fetch("/api/social/publish", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ platform, item: { caption: item.caption, hashtags: item.hashtags, mediaUrl: item.mediaUrl } }),
  });
  const data = await safeJson(r);
  return data || { published: false, reason: "not_configured" }; // API layer unreachable — treat like "not connected"
}

function publishFallbackNote(platform, reason) {
  const map = {
    not_configured: `${platform} isn't connected yet (no API credentials) — copied for manual posting instead.`,
    account_not_connected: `Your ${platform} account isn't connected yet — copied for manual posting instead.`,
    media_required: `${platform} requires an image or video attached — copied for manual posting instead.`,
    over_character_limit: `That caption is over ${platform}'s character limit — copied anyway, trim before posting.`,
    not_implemented: `${platform} publishing is scaffolded but not finished yet — copied for manual posting instead.`,
  };
  return map[reason] || `Couldn't publish directly to ${platform} yet — copied for manual posting instead.`;
}

function formatVideoScript(s) {
  const beats = (s.beats || []).map((b, i) => `${i + 1}. ${b}`).join("\n");
  const onScreen = (s.onScreenText || []).length ? `\n\nOn-screen text ideas: ${s.onScreenText.join(" / ")}` : "";
  return `HOOK: ${s.hook}\n\n${beats}\n\nCTA: ${s.cta}${onScreen}`;
}

// ─── Sign in (dev-mode — see src/social/store.js header comment) ──
function SignIn({ onSignedIn }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <Card style={{ width: 380 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <Sparkles size={20} color={S.accent} />
          <div style={{ fontSize: 18, fontWeight: 800 }}>Veridian Social</div>
        </div>
        <div style={{ fontSize: 13, color: S.textSub, marginBottom: 18 }}>
          Dev-mode sign-in — no password yet. Real authentication ships once Supabase Auth credentials are provisioned (see CHANGELOG.md).
        </div>
        <form onSubmit={(e) => { e.preventDefault(); if (email.trim()) onSignedIn(devAuth.signIn(email, name)); }}>
          <Field label="Email"><input style={inputStyle} value={email} onChange={e => setEmail(e.target.value)} type="email" required placeholder="you@yourbusiness.com" /></Field>
          <Field label="Name"><input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="Optional" /></Field>
          <Btn type="submit" style={{ width: "100%", justifyContent: "center", marginTop: 4 }}>Continue</Btn>
        </form>
      </Card>
    </div>
  );
}

// ─── Workspace picker ───────────────────────────────────────────
function WorkspacePicker({ user, onEnter }) {
  const [list, setList] = useState(() => workspaces.list().filter(w => w.ownerEmail === user.email));
  const [name, setName] = useState("");

  const create = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    const ws = workspaces.insert({ name: name.trim(), ownerEmail: user.email });
    setList([...list, ws]);
    onEnter(ws);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: 420 }}>
        <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Welcome, {user.name}</div>
        <div style={{ fontSize: 13, color: S.textSub, marginBottom: 20 }}>Pick a workspace or create your first one.</div>
        {list.map(ws => (
          <Card key={ws.id} style={{ marginBottom: 10, cursor: "pointer" }}>
            <div onClick={() => onEnter(ws)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontWeight: 700 }}>{ws.name}</div>
              <Btn variant="ghost" onClick={() => onEnter(ws)}>Open</Btn>
            </div>
          </Card>
        ))}
        <Card>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Create a workspace</div>
          <form onSubmit={create}>
            <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Riverside Coffee Co." />
            <Btn type="submit" style={{ marginTop: 10, width: "100%", justifyContent: "center" }}><Plus size={14} /> Create workspace</Btn>
          </form>
        </Card>
      </div>
    </div>
  );
}

// ─── Brand creation ─────────────────────────────────────────────
function CreateBrand({ workspaceId, onCreated, onCancel }) {
  const [form, setForm] = useState({ businessName: "", industry: "", description: "", tone: "", targetAudience: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.businessName.trim() || !form.description.trim()) return;
    setBusy(true); setError("");
    try {
      const { text: brandVoice } = await generate("brandVoice", form);
      const brand = brands.insert({ workspaceId, ...form, brandVoice });
      onCreated(brand);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card style={{ maxWidth: 520 }}>
      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Add a brand</div>
      <form onSubmit={submit}>
        <Field label="Business name"><input style={inputStyle} value={form.businessName} onChange={set("businessName")} required /></Field>
        <Field label="Industry"><input style={inputStyle} value={form.industry} onChange={set("industry")} placeholder="e.g. restaurant, gym, law firm" /></Field>
        <Field label="Describe your business"><textarea style={{ ...inputStyle, minHeight: 80, resize: "vertical" }} value={form.description} onChange={set("description")} required placeholder="What you do, what makes you different, what you want customers to feel." /></Field>
        <Field label="Desired tone (optional)"><input style={inputStyle} value={form.tone} onChange={set("tone")} placeholder="e.g. warm and casual, or bold and expert" /></Field>
        <Field label="Target audience (optional)"><input style={inputStyle} value={form.targetAudience} onChange={set("targetAudience")} /></Field>
        {error && <div style={{ color: S.red, fontSize: 12.5, marginBottom: 10 }}>{error}</div>}
        <div style={{ display: "flex", gap: 8 }}>
          <Btn type="submit" disabled={busy}><Sparkles size={14} /> {busy ? "AI is learning your brand…" : "Create & generate brand voice"}</Btn>
          <Btn variant="ghost" onClick={onCancel} disabled={busy}>Cancel</Btn>
        </div>
      </form>
    </Card>
  );
}

// ─── Draft / video-script card ───────────────────────────────────
function DraftCard({ item, brand, mediaOptions, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(item.caption);
  const [busyAction, setBusyAction] = useState(null); // "hashtags" | "publish" | null
  const [note, setNote] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [scheduleAt, setScheduleAt] = useState("");
  const [mediaId, setMediaId] = useState(item.mediaAssetId || "");

  const act = (status, extra = {}) => onUpdate(contentItems.updateWithHistory(item.id, { status, ...extra }));

  const regenerateHashtags = async () => {
    setBusyAction("hashtags"); setNote("");
    try {
      const { hashtags } = await generate("hashtags", { brandVoice: brand.brandVoice, caption: item.caption, platform: item.platform });
      onUpdate(contentItems.updateWithHistory(item.id, { hashtags }));
    } catch (err) {
      setNote(err.message);
    } finally {
      setBusyAction(null);
    }
  };

  const schedule = () => {
    if (!scheduleAt) return;
    act("scheduled", { scheduledFor: new Date(scheduleAt).toISOString() });
  };

  const attachMedia = (id) => {
    setMediaId(id);
    const asset = mediaOptions.find(m => m.id === id);
    onUpdate(contentItems.update(item.id, { mediaAssetId: id || null, mediaUrl: asset?.url || null }));
  };

  const publish = async () => {
    setBusyAction("publish"); setNote("");
    let fallbackNote = "";
    if (item.platform && item.platform !== "general") {
      try {
        const result = await attemptPublish(item.platform, { ...item });
        if (result.published) {
          onUpdate(contentItems.updateWithHistory(item.id, { status: "published", publishedAt: new Date().toISOString() }));
          setBusyAction(null);
          return;
        }
        fallbackNote = publishFallbackNote(item.platform, result.reason);
      } catch {
        fallbackNote = "Publish check failed — copied for manual posting instead.";
      }
    }
    navigator.clipboard?.writeText(item.caption + (item.hashtags ? `\n\n${item.hashtags}` : ""));
    onUpdate(contentItems.updateWithHistory(item.id, { status: "published", publishedAt: new Date().toISOString() }));
    setNote(fallbackNote || "Copied to clipboard for manual posting.");
    setBusyAction(null);
  };

  const canAct = item.status === "draft" || item.status === "approved" || item.status === "edited" || item.status === "scheduled";

  return (
    <Card style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10, gap: 8, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <Pill tone={STATUS_TONE[item.status]}>{item.status.toUpperCase()}</Pill>
          {item.type === "video_script" && <Pill tone="accent"><Film size={10} style={{ verticalAlign: -1 }} /> VIDEO SCRIPT</Pill>}
          {item.platform && item.platform !== "general" && <Pill>{item.platform}</Pill>}
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {item.scheduledFor && (
            <div style={{ fontSize: 11, color: S.amber, display: "flex", alignItems: "center", gap: 4 }}>
              <CalendarClock size={11} /> {new Date(item.scheduledFor).toLocaleString()}
            </div>
          )}
          <div style={{ fontSize: 11, color: S.textDim, display: "flex", alignItems: "center", gap: 4 }}><Clock size={11} /> {new Date(item.createdAt).toLocaleDateString()}</div>
        </div>
      </div>

      {editing ? (
        <textarea style={{ ...inputStyle, minHeight: 110, marginBottom: 10 }} value={text} onChange={e => setText(e.target.value)} />
      ) : (
        <div style={{ fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-wrap", marginBottom: 10 }}>{item.caption}</div>
      )}
      {item.hashtags && !editing && <div style={{ fontSize: 12.5, color: S.accent, marginBottom: 12 }}>{item.hashtags}</div>}

      {item.history?.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <button onClick={() => setShowHistory(h => !h)} style={{ background: "none", border: "none", color: S.textDim, fontSize: 11.5, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, padding: 0 }}>
            <History size={11} /> {showHistory ? "Hide" : "Show"} {item.history.length} earlier version{item.history.length > 1 ? "s" : ""}
          </button>
          {showHistory && (
            <div style={{ marginTop: 8, borderLeft: `2px solid ${S.border}`, paddingLeft: 10 }}>
              {item.history.map((h, i) => (
                <div key={i} style={{ fontSize: 12, color: S.textDim, marginBottom: 8, whiteSpace: "pre-wrap" }}>
                  <div style={{ fontSize: 10, color: S.textDim, marginBottom: 2 }}>{new Date(h.at).toLocaleString()}</div>
                  {h.caption}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {note && <div style={{ fontSize: 12, color: S.amber, marginBottom: 10 }}>{note}</div>}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        {item.status === "draft" && !editing && (
          <>
            <Btn variant="success" onClick={() => act("approved", { approvedAt: new Date().toISOString() })}><ThumbsUp size={13} /> Approve</Btn>
            <Btn variant="ghost" onClick={() => setEditing(true)}><Edit3 size={13} /> Edit</Btn>
            <Btn variant="danger" onClick={() => act("rejected")}><ThumbsDown size={13} /> Reject</Btn>
            {item.type !== "video_script" && (
              <Btn variant="ghost" onClick={regenerateHashtags} disabled={busyAction === "hashtags"}>
                {busyAction === "hashtags" ? "Regenerating…" : "Regenerate hashtags"}
              </Btn>
            )}
          </>
        )}
        {editing && (
          <>
            <Btn variant="success" onClick={() => { act("edited", { caption: text, approvedAt: new Date().toISOString() }); setEditing(false); }}><CheckCircle size={13} /> Save & approve</Btn>
            <Btn variant="ghost" onClick={() => setEditing(false)}>Cancel</Btn>
          </>
        )}
        {(item.status === "approved" || item.status === "edited" || item.status === "scheduled") && !editing && (
          <>
            {mediaOptions.length > 0 && (
              <select value={mediaId} onChange={e => attachMedia(e.target.value)} style={{ ...inputStyle, width: "auto", padding: "7px 10px", fontSize: 12.5 }}>
                <option value="">No media attached</option>
                {mediaOptions.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
              </select>
            )}
            <input type="datetime-local" value={scheduleAt} onChange={e => setScheduleAt(e.target.value)} style={{ ...inputStyle, width: "auto", padding: "7px 10px", fontSize: 12.5 }} />
            <Btn variant="ghost" onClick={schedule} disabled={!scheduleAt}><Calendar size={13} /> Schedule</Btn>
            <Btn variant="primary" onClick={publish} disabled={busyAction === "publish"}>
              <Send size={13} /> {busyAction === "publish" ? "Publishing…" : "Publish now"}
            </Btn>
          </>
        )}
      </div>
    </Card>
  );
}

// ─── Media library (brand-scoped) ────────────────────────────────
function MediaLibrary({ brandId }) {
  const [items, setItems] = useState(() => mediaAssets.list(brandId));
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");

  const add = (e) => {
    e.preventDefault();
    if (!url.trim()) return;
    mediaAssets.insert({ brandId, url: url.trim(), label: label.trim() || url.trim() });
    setItems(mediaAssets.list(brandId));
    setUrl(""); setLabel("");
  };

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}><ImageIcon size={14} color={S.accent} /> Add media</div>
        <div style={{ fontSize: 12, color: S.textSub, marginBottom: 12 }}>
          Link-based for now — direct upload needs file storage that isn't provisioned yet. Paste a publicly reachable image or video URL.
        </div>
        <form onSubmit={add} style={{ display: "flex", gap: 8 }}>
          <input style={{ ...inputStyle, flex: 2 }} value={url} onChange={e => setUrl(e.target.value)} placeholder="https://…" />
          <input style={{ ...inputStyle, flex: 1 }} value={label} onChange={e => setLabel(e.target.value)} placeholder="Label (optional)" />
          <Btn type="submit"><Plus size={14} /> Add</Btn>
        </form>
      </Card>
      {items.length === 0 && <div style={{ color: S.textDim, fontSize: 13, textAlign: "center", padding: 30 }}>No media yet.</div>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 10 }}>
        {items.map(m => (
          <Card key={m.id}>
            <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 4 }}>{m.label}</div>
            <div style={{ fontSize: 11, color: S.textDim, wordBreak: "break-all" }}>{m.url}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Brand detail: generate + calendar ───────────────────────────
function BrandDetail({ brand }) {
  const [items, setItems] = useState(() => contentItems.list(brand.id));
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState("general");
  const [scriptTopic, setScriptTopic] = useState("");
  const [busy, setBusy] = useState(false);
  const [scriptBusy, setScriptBusy] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("calendar");
  const media = useMemo(() => mediaAssets.list(brand.id), [tab]);

  const refresh = () => setItems(contentItems.list(brand.id));

  const genDrafts = async (e) => {
    e.preventDefault();
    if (!topic.trim()) return;
    setBusy(true); setError("");
    try {
      const { drafts } = await generate("drafts", { brandVoice: brand.brandVoice, topic, count: 3, platform });
      drafts.forEach(d => contentItems.insert({ brandId: brand.id, status: "draft", type: "post", platform, caption: d.caption, hashtags: d.hashtags || "" }));
      refresh();
      setTopic("");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const genScript = async (e) => {
    e.preventDefault();
    if (!scriptTopic.trim()) return;
    setScriptBusy(true); setError("");
    try {
      const { script } = await generate("videoScript", { brandVoice: brand.brandVoice, topic: scriptTopic, platform: platform === "general" ? "tiktok" : platform });
      contentItems.insert({ brandId: brand.id, status: "draft", type: "video_script", platform: platform === "general" ? "tiktok" : platform, caption: formatVideoScript(script), hashtags: "" });
      refresh();
      setScriptTopic("");
    } catch (err) {
      setError(err.message);
    } finally {
      setScriptBusy(false);
    }
  };

  const counts = useMemo(() => {
    const c = { draft: 0, approved: 0, edited: 0, rejected: 0, scheduled: 0, published: 0 };
    items.forEach(i => { c[i.status] = (c[i.status] || 0) + 1; });
    return c;
  }, [items]);

  const pending = pendingReviewCount(brand.id);
  const sorted = [...items].sort((a, b) => (b.scheduledFor || b.createdAt).localeCompare(a.scheduledFor || a.createdAt));

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        <div style={{ fontSize: 20, fontWeight: 800 }}>{brand.businessName}</div>
        <Pill tone="accent">{brand.industry || "brand"}</Pill>
        {pending > 0 && <Pill tone="amber"><Bell size={10} style={{ verticalAlign: -1 }} /> {pending} awaiting review</Pill>}
      </div>
      <div style={{ fontSize: 12.5, color: S.textSub, marginBottom: 20, maxWidth: 640 }}>{brand.brandVoice}</div>

      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        {["calendar", "media", "analytics"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            background: tab === t ? S.accentB : "transparent", color: tab === t ? S.accent : S.textSub,
            border: `1px solid ${tab === t ? S.accent + "44" : S.border}`, borderRadius: 8, padding: "7px 14px",
            fontSize: 12.5, fontWeight: 700, cursor: "pointer", textTransform: "capitalize",
          }}>{t}</button>
        ))}
      </div>

      {tab === "calendar" && (
        <>
          <Card style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}><Zap size={14} color={S.accent} /> Generate drafts</div>
            <form onSubmit={genDrafts} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <input style={{ ...inputStyle, flex: 1, minWidth: 220 }} value={topic} onChange={e => setTopic(e.target.value)} placeholder="Topic or occasion — e.g. weekend hours, new menu item, a customer win" />
              <select value={platform} onChange={e => setPlatform(e.target.value)} style={{ ...inputStyle, width: "auto" }}>
                {PLATFORMS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
              </select>
              <Btn type="submit" disabled={busy}>{busy ? "Writing…" : "Generate 3 drafts"}</Btn>
            </form>
          </Card>

          <Card style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}><Film size={14} color={S.accent} /> Generate a short-form video script</div>
            <form onSubmit={genScript} style={{ display: "flex", gap: 8 }}>
              <input style={{ ...inputStyle, flex: 1 }} value={scriptTopic} onChange={e => setScriptTopic(e.target.value)} placeholder="Topic — e.g. behind the scenes, a quick tip, a product demo" />
              <Btn type="submit" disabled={scriptBusy}>{scriptBusy ? "Writing…" : "Generate script"}</Btn>
            </form>
          </Card>
          {error && <div style={{ color: S.red, fontSize: 12.5, marginBottom: 16 }}>{error}</div>}

          {items.length === 0 && <div style={{ color: S.textDim, fontSize: 13, textAlign: "center", padding: 40 }}>No content yet — generate your first drafts or a video script above.</div>}
          {sorted.map(item => (
            <DraftCard key={item.id} item={item} brand={brand} mediaOptions={media} onUpdate={refresh} />
          ))}
        </>
      )}

      {tab === "media" && <MediaLibrary brandId={brand.id} />}

      {tab === "analytics" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 12 }}>
          {Object.entries(counts).map(([k, v]) => (
            <Card key={k}><div style={{ fontSize: 26, fontWeight: 800 }}>{v}</div><div style={{ fontSize: 11.5, color: S.textSub, textTransform: "capitalize" }}>{k}</div></Card>
          ))}
          <Card style={{ gridColumn: "1 / -1", background: S.surface }}>
            <div style={{ fontSize: 12, color: S.textDim }}>Real engagement analytics (reach, likes, comments) require connecting social accounts via each platform's API — not yet configured. See Settings.</div>
          </Card>
        </div>
      )}
    </div>
  );
}

// ─── Settings: connect accounts (real state) + billing (stub) ────
function SettingsPanel() {
  const [publishers, setPublishers] = useState(null);

  useEffect(() => {
    fetch("/api/social/publish").then(r => r.json()).then(d => setPublishers(d.publishers)).catch(() => setPublishers([]));
  }, []);

  return (
    <div style={{ maxWidth: 560 }}>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Connect social accounts</div>
        <div style={{ fontSize: 12.5, color: S.textSub, lineHeight: 1.6, marginBottom: 12 }}>
          Each platform needs a registered app and (for most) a review process before publishing works —
          that's an external, credential-gated step nobody can skip. This list reflects real, live status,
          not a guess.
        </div>
        {publishers === null && <div style={{ fontSize: 12, color: S.textDim }}>Checking…</div>}
        {publishers && (
          <div style={{ display: "grid", gap: 6 }}>
            {publishers.map(p => (
              <div key={p.platform} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", background: S.surface, borderRadius: 8 }}>
                <div style={{ fontSize: 13, textTransform: "capitalize" }}>{p.platform}</div>
                <Pill tone={p.configured ? "green" : "textSub"}>{p.configured ? "Connected" : "Not connected"}</Pill>
              </div>
            ))}
          </div>
        )}
        <div style={{ fontSize: 11.5, color: S.textDim, marginTop: 12 }}>
          Until a platform shows Connected, its approved content is copied to your clipboard for manual posting.
        </div>
      </Card>
      <Card>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Billing</div>
        <div style={{ fontSize: 12.5, color: S.textSub, lineHeight: 1.6 }}>
          Subscriptions require a live Stripe account and API keys. Not configured in this environment —
          the workspace runs unmetered until billing is wired up.
        </div>
      </Card>
    </div>
  );
}

// ─── Root ───────────────────────────────────────────────────────
export default function Social() {
  useInjectedStyle(SCSS);
  const [user, setUser] = useState(() => devAuth.current());
  const [workspace, setWorkspace] = useState(null);
  const [brandList, setBrandList] = useState([]);
  const [activeBrand, setActiveBrand] = useState(null);
  const [creatingBrand, setCreatingBrand] = useState(false);
  const [view, setView] = useState("brands");

  useEffect(() => {
    if (workspace) setBrandList(brands.list(workspace.id));
  }, [workspace]);

  if (!user) return <SignIn onSignedIn={setUser} />;
  if (!workspace) return <WorkspacePicker user={user} onEnter={setWorkspace} />;

  const totalPending = brandList.reduce((sum, b) => sum + pendingReviewCount(b.id), 0);
  const nav = [
    { id: "brands", label: "Brands", icon: Sparkles, badge: totalPending || null },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <div style={{ width: 220, borderRight: `1px solid ${S.border}`, padding: 20, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <Sparkles size={18} color={S.accent} /><div style={{ fontWeight: 800, fontSize: 15 }}>Veridian Social</div>
        </div>
        <div style={{ fontSize: 11.5, color: S.textDim, marginBottom: 24 }}>{workspace.name}</div>
        {nav.map(n => (
          <button key={n.id} onClick={() => { setView(n.id); setActiveBrand(null); }} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, background: view === n.id ? S.accentB : "transparent",
            color: view === n.id ? S.accent : S.textSub, border: "none", borderRadius: 8, padding: "9px 10px",
            fontSize: 13, fontWeight: 600, cursor: "pointer", marginBottom: 4, textAlign: "left",
          }}>
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}><n.icon size={15} /> {n.label}</span>
            {n.badge ? <Pill tone="amber">{n.badge}</Pill> : null}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button onClick={() => { devAuth.signOut(); setUser(null); setWorkspace(null); }} style={{
          display: "flex", alignItems: "center", gap: 8, background: "transparent", color: S.textDim,
          border: "none", padding: "9px 10px", fontSize: 12.5, cursor: "pointer",
        }}><LogOut size={14} /> Sign out</button>
      </div>

      <div style={{ flex: 1, padding: 32, maxWidth: 960 }}>
        {view === "settings" && <SettingsPanel />}

        {view === "brands" && !activeBrand && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 20, fontWeight: 800 }}>Brands</div>
              {!creatingBrand && <Btn onClick={() => setCreatingBrand(true)}><Plus size={14} /> Add brand</Btn>}
            </div>
            {creatingBrand && (
              <div style={{ marginBottom: 20 }}>
                <CreateBrand workspaceId={workspace.id}
                  onCreated={(b) => { setBrandList([...brandList, b]); setCreatingBrand(false); setActiveBrand(b); }}
                  onCancel={() => setCreatingBrand(false)} />
              </div>
            )}
            {brandList.length === 0 && !creatingBrand && (
              <div style={{ color: S.textDim, fontSize: 13, textAlign: "center", padding: 60 }}>No brands yet. Add your first brand to start generating content.</div>
            )}
            <div style={{ display: "grid", gap: 12 }}>
              {brandList.map(b => {
                const p = pendingReviewCount(b.id);
                return (
                  <Card key={b.id} style={{ cursor: "pointer" }}>
                    <div onClick={() => setActiveBrand(b)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
                          {b.businessName} {p > 0 && <Pill tone="amber">{p} pending</Pill>}
                        </div>
                        <div style={{ fontSize: 12, color: S.textSub }}>{b.industry || "—"}</div>
                      </div>
                      <Btn variant="ghost" onClick={() => setActiveBrand(b)}>Open</Btn>
                    </div>
                  </Card>
                );
              })}
            </div>
          </>
        )}

        {view === "brands" && activeBrand && (
          <>
            <Btn variant="ghost" onClick={() => setActiveBrand(null)} style={{ marginBottom: 16 }}>← All brands</Btn>
            <BrandDetail brand={activeBrand} />
          </>
        )}
      </div>
    </div>
  );
}
