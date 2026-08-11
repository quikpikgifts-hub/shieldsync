import React, { useState, useEffect, useMemo } from "react";
import { CheckCircle, Sparkles, Calendar, Send, Edit3, ThumbsDown, ThumbsUp, Clock, Zap, Film, Image as ImageIcon, History, CalendarClock, Bell, Plus } from "lucide-react";
import { T } from "../shell/theme.js";
import { Btn, Card, Field, inputStyle, Pill } from "../shell/primitives.jsx";
import { brands, contentItems, mediaAssets, pendingReviewCount } from "./store.js";

// TikTok listed first — it's the Founder Alpha pilot platform (the only one
// with a real, working publish path today; see api/_lib/publishers/tiktok.js).
export const PLATFORMS = [
  { key: "tiktok", label: "TikTok (pilot)" },
  { key: "instagram", label: "Instagram" },
  { key: "facebook", label: "Facebook" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "youtube", label: "YouTube" },
  { key: "x", label: "X" },
  { key: "pinterest", label: "Pinterest" },
  { key: "general", label: "General / unspecified" },
];

// Rotating topic starters so the founder never stares at a blank box —
// a real, if modest, friction-removal per the executive directive.
export const TOPIC_SUGGESTIONS = [
  "Behind the scenes of how we do this today",
  "A common question customers ask us",
  "A quick tip related to what we do",
  "What makes us different from the alternative",
  "A recent win or customer moment",
  "Something we're working on this week",
  "A myth people believe about our industry",
  "Why we started this business",
];

export function randomTopicSuggestion() {
  return TOPIC_SUGGESTIONS[Math.floor(Math.random() * TOPIC_SUGGESTIONS.length)];
}

const STATUS_TONE = { draft: "textSub", approved: "green", edited: "accent", rejected: "red", scheduled: "amber", published: "green" };

// ─── AI + publish calls ───────────────────────────────────────────
export async function safeJson(r) {
  try {
    return await r.json();
  } catch {
    // Non-JSON response — most commonly means /api/* isn't being served at
    // all (e.g. running `vite dev` directly instead of `vercel dev`, or the
    // route isn't deployed yet), not an application error.
    return null;
  }
}

// Distinguishes "you're offline" from "the API failed" — a founder who
// loses wifi mid-generation should see that plainly, not a generic error.
function isOffline() {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

export async function generate(agent, input) {
  if (isOffline()) throw new Error("You're offline — reconnect to generate content. Your existing drafts are still here.");
  const r = await fetch("/api/social/generate", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ agent, input }),
  });
  const data = await safeJson(r);
  if (!data) throw new Error("AI generation endpoint didn't respond as expected — is the API layer running?");
  if (!r.ok) throw new Error(data.error || "Generation failed");
  return data;
}

export async function attemptPublish(platform, item) {
  if (isOffline()) return { published: false, reason: "offline" };
  const r = await fetch("/api/social/publish", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ platform, item: { caption: item.caption, hashtags: item.hashtags, mediaUrl: item.mediaUrl } }),
  });
  const data = await safeJson(r);
  return data || { published: false, reason: "not_configured" }; // API layer unreachable — treat like "not connected"
}

export function publishFallbackNote(platform, reason) {
  const map = {
    not_configured: `${platform} isn't connected yet (no API credentials) — copied for manual posting instead.`,
    account_not_connected: `Your ${platform} account isn't connected yet — copied for manual posting instead.`,
    media_required: `${platform} requires an image or video attached — copied for manual posting instead.`,
    over_character_limit: `That caption is over ${platform}'s character limit — copied anyway, trim before posting.`,
    not_implemented: `${platform} publishing is scaffolded but not finished yet — copied for manual posting instead.`,
    offline: `You're offline — copied to clipboard so you can post manually once you're back online.`,
  };
  return map[reason] || `Couldn't publish directly to ${platform} yet — copied for manual posting instead.`;
}

export function formatVideoScript(s) {
  const beats = (s.beats || []).map((b, i) => `${i + 1}. ${b}`).join("\n");
  const onScreen = (s.onScreenText || []).length ? `\n\nOn-screen text ideas: ${s.onScreenText.join(" / ")}` : "";
  return `HOOK: ${s.hook}\n\n${beats}\n\nCTA: ${s.cta}${onScreen}`;
}

// ─── Brand creation ─────────────────────────────────────────────
export function CreateBrand({ workspaceId, onCreated, onCancel }) {
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
        {error && <div style={{ color: T.red, fontSize: 12.5, marginBottom: 10 }}>{error}</div>}
        <div style={{ display: "flex", gap: 8 }}>
          <Btn type="submit" disabled={busy}><Sparkles size={14} /> {busy ? "AI is learning your brand…" : "Create & generate brand voice"}</Btn>
          <Btn variant="ghost" onClick={onCancel} disabled={busy}>Cancel</Btn>
        </div>
      </form>
    </Card>
  );
}

// ─── Draft / video-script card ───────────────────────────────────
export function DraftCard({ item, brand, mediaOptions, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(item.caption);
  const [busyAction, setBusyAction] = useState(null); // "hashtags" | "publish" | null
  const [note, setNote] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [scheduleAt, setScheduleAt] = useState("");
  const [mediaId, setMediaId] = useState(item.mediaAssetId || "");

  const act = (status, extra = {}) => onUpdate(contentItems.updateWithHistory(item.id, { status, ...extra }));

  const reuse = () => {
    contentItems.insert({
      brandId: item.brandId, status: "draft", type: item.type, platform: item.platform,
      caption: item.caption, hashtags: item.hashtags || "",
    });
    onUpdate();
  };

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
            <div style={{ fontSize: 11, color: T.amber, display: "flex", alignItems: "center", gap: 4 }}>
              <CalendarClock size={11} /> {new Date(item.scheduledFor).toLocaleString()}
            </div>
          )}
          <div style={{ fontSize: 11, color: T.textDim, display: "flex", alignItems: "center", gap: 4 }}><Clock size={11} /> {new Date(item.createdAt).toLocaleDateString()}</div>
        </div>
      </div>

      {editing ? (
        <textarea style={{ ...inputStyle, minHeight: 110, marginBottom: 10 }} value={text} onChange={e => setText(e.target.value)} />
      ) : (
        <div style={{ fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-wrap", marginBottom: 10 }}>{item.caption}</div>
      )}
      {item.hashtags && !editing && <div style={{ fontSize: 12.5, color: T.accent, marginBottom: 12 }}>{item.hashtags}</div>}

      {item.history?.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <button onClick={() => setShowHistory(h => !h)} style={{ background: "none", border: "none", color: T.textDim, fontSize: 11.5, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, padding: 0 }}>
            <History size={11} /> {showHistory ? "Hide" : "Show"} {item.history.length} earlier version{item.history.length > 1 ? "s" : ""}
          </button>
          {showHistory && (
            <div style={{ marginTop: 8, borderLeft: `2px solid ${T.border}`, paddingLeft: 10 }}>
              {item.history.map((h, i) => (
                <div key={i} style={{ fontSize: 12, color: T.textDim, marginBottom: 8, whiteSpace: "pre-wrap" }}>
                  <div style={{ fontSize: 10, color: T.textDim, marginBottom: 2 }}>{new Date(h.at).toLocaleString()}</div>
                  {h.caption}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {note && <div style={{ fontSize: 12, color: T.amber, marginBottom: 10 }}>{note}</div>}

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
        {(item.status === "published" || item.status === "rejected") && (
          <Btn variant="ghost" onClick={reuse}><Sparkles size={13} /> Reuse as new draft</Btn>
        )}
      </div>
    </Card>
  );
}

// ─── Media library (brand-scoped) ────────────────────────────────
export function MediaLibrary({ brandId }) {
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
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}><ImageIcon size={14} color={T.accent} /> Add media</div>
        <div style={{ fontSize: 12, color: T.textSub, marginBottom: 12 }}>
          Link-based for now — direct upload needs file storage that isn't provisioned yet. Paste a publicly reachable image or video URL.
        </div>
        <form onSubmit={add} style={{ display: "flex", gap: 8 }}>
          <input style={{ ...inputStyle, flex: 2 }} value={url} onChange={e => setUrl(e.target.value)} placeholder="https://…" />
          <input style={{ ...inputStyle, flex: 1 }} value={label} onChange={e => setLabel(e.target.value)} placeholder="Label (optional)" />
          <Btn type="submit"><Plus size={14} /> Add</Btn>
        </form>
      </Card>
      {items.length === 0 && <div style={{ color: T.textDim, fontSize: 13, textAlign: "center", padding: 30 }}>No media yet.</div>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 10 }}>
        {items.map(m => (
          <Card key={m.id}>
            <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 4 }}>{m.label}</div>
            <div style={{ fontSize: 11, color: T.textDim, wordBreak: "break-all" }}>{m.url}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Brand detail: generate + calendar ───────────────────────────
export function BrandDetail({ brand }) {
  const [items, setItems] = useState(() => contentItems.list(brand.id));
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState("tiktok");
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
      <div style={{ fontSize: 12.5, color: T.textSub, marginBottom: 20, maxWidth: 640 }}>{brand.brandVoice}</div>

      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        {["calendar", "media", "analytics"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            background: tab === t ? T.accentB : "transparent", color: tab === t ? T.accent : T.textSub,
            border: `1px solid ${tab === t ? T.accent + "44" : T.border}`, borderRadius: 8, padding: "7px 14px",
            fontSize: 12.5, fontWeight: 700, cursor: "pointer", textTransform: "capitalize",
          }}>{t}</button>
        ))}
      </div>

      {tab === "calendar" && (
        <>
          <Card style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}><Zap size={14} color={T.accent} /> Generate drafts</div>
            <form onSubmit={genDrafts} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <input style={{ ...inputStyle, flex: 1, minWidth: 220 }} value={topic} onChange={e => setTopic(e.target.value)} placeholder="Topic or occasion — e.g. weekend hours, new menu item, a customer win" />
              <Btn variant="ghost" onClick={() => setTopic(randomTopicSuggestion())}>Surprise me</Btn>
              <select value={platform} onChange={e => setPlatform(e.target.value)} style={{ ...inputStyle, width: "auto" }}>
                {PLATFORMS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
              </select>
              <Btn type="submit" disabled={busy}>{busy ? "Writing…" : "Generate 3 drafts"}</Btn>
            </form>
          </Card>

          <Card style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}><Film size={14} color={T.accent} /> Generate a short-form video script</div>
            <form onSubmit={genScript} style={{ display: "flex", gap: 8 }}>
              <input style={{ ...inputStyle, flex: 1 }} value={scriptTopic} onChange={e => setScriptTopic(e.target.value)} placeholder="Topic — e.g. behind the scenes, a quick tip, a product demo" />
              <Btn variant="ghost" onClick={() => setScriptTopic(randomTopicSuggestion())}>Surprise me</Btn>
              <Btn type="submit" disabled={scriptBusy}>{scriptBusy ? "Writing…" : "Generate script"}</Btn>
            </form>
          </Card>
          {error && <div style={{ color: T.red, fontSize: 12.5, marginBottom: 16 }}>{error}</div>}

          {items.length === 0 && <div style={{ color: T.textDim, fontSize: 13, textAlign: "center", padding: 40 }}>No content yet — generate your first drafts or a video script above.</div>}
          {sorted.map(item => (
            <DraftCard key={item.id} item={item} brand={brand} mediaOptions={media} onUpdate={refresh} />
          ))}
        </>
      )}

      {tab === "media" && <MediaLibrary brandId={brand.id} />}

      {tab === "analytics" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 12 }}>
          {Object.entries(counts).map(([k, v]) => (
            <Card key={k}><div style={{ fontSize: 26, fontWeight: 800 }}>{v}</div><div style={{ fontSize: 11.5, color: T.textSub, textTransform: "capitalize" }}>{k}</div></Card>
          ))}
          <Card style={{ gridColumn: "1 / -1", background: T.surface }}>
            <div style={{ fontSize: 12, color: T.textDim }}>Real engagement analytics (reach, likes, comments) require connecting social accounts via each platform's API — not yet configured. See Settings.</div>
          </Card>
        </div>
      )}
    </div>
  );
}

const STATE_TONE = {
  waiting_for_credentials: "textSub",
  configuration_required: "amber",
  ready_to_activate: "accent",
  connected: "green",
};

function formatLastVerified(ts) {
  if (!ts) return "Never verified";
  return new Date(ts).toLocaleString();
}

// ─── Single activation/configuration screen (real, live) ──────────
// One card per provider, every field the founder needs to go from
// "building" to "activated": current status, exactly which credentials
// and scopes are required, whether an OAuth flow even exists yet, whether
// an account is actually connected, when it was last verified, and one
// action button. Never fabricates a status — see
// api/_lib/publishers/states.js. Not renamed "Connect social accounts"
// header kept as the visible label; this *is* the activation screen.
export function SocialConnectionsPanel() {
  const [publishers, setPublishers] = useState(null);
  const [busyPlatform, setBusyPlatform] = useState(null);
  const [verifyResults, setVerifyResults] = useState({});

  const refresh = () => fetch("/api/social/publish").then(r => r.json()).then(d => setPublishers(d.publishers)).catch(() => setPublishers([]));

  useEffect(() => { refresh(); }, []);

  const disconnectPlatform = async (platformKey) => {
    setBusyPlatform(platformKey);
    try {
      await fetch(`/api/social/oauth/${platformKey}/disconnect`, { method: "POST" });
      await refresh();
    } finally {
      setBusyPlatform(null);
    }
  };

  const verify = async (platform) => {
    setBusyPlatform(platform);
    try {
      const r = await fetch("/api/social/verify", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ platform }),
      });
      const data = await safeJson(r);
      setVerifyResults(v => ({ ...v, [platform]: data || { ok: false, reason: "verification_failed" } }));
      await refresh();
    } finally {
      setBusyPlatform(null);
    }
  };

  return (
    <Card style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Platform activation</div>
      <div style={{ fontSize: 12.5, color: T.textSub, lineHeight: 1.6, marginBottom: 12 }}>
        Every field below reflects real, live status — nothing here is a placeholder. Until a platform
        shows Connected, its approved content is copied to your clipboard for manual posting instead.
      </div>
      {publishers === null && <div style={{ fontSize: 12, color: T.textDim }}>Checking…</div>}
      {publishers && (
        <div style={{ display: "grid", gap: 10 }}>
          {publishers.map(p => {
            const verifyResult = verifyResults[p.platform];
            return (
              <div key={p.platform} style={{ background: T.surface, borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, textTransform: "capitalize" }}>
                    {p.platform}{p.platform === "tiktok" && <span style={{ color: T.accent, fontWeight: 700, fontSize: 10, marginLeft: 6 }}>PILOT</span>}
                  </div>
                  <Pill tone={STATE_TONE[p.state]}>{p.label}</Pill>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: "4px 16px", fontSize: 11.5, color: T.textSub, marginBottom: 10 }}>
                  <div><span style={{ color: T.textDim }}>Required credentials: </span>{p.requiredEnv.join(", ")}</div>
                  <div><span style={{ color: T.textDim }}>Required scopes: </span>{p.requiredScopes.join(", ")}</div>
                  <div><span style={{ color: T.textDim }}>OAuth flow: </span>{p.oauthAvailable ? "Built" : "Not yet available"}</div>
                  <div><span style={{ color: T.textDim }}>Connection: </span>{p.state === "connected" ? (p.accountDisplayName ? `Connected as ${p.accountDisplayName}` : "Account connected") : "No account connected"}</div>
                  <div><span style={{ color: T.textDim }}>Last verification: </span>{formatLastVerified(p.lastVerifiedAt)}</div>
                </div>
                {verifyResult && (
                  <div style={{ fontSize: 11.5, color: verifyResult.ok ? T.green : T.red, marginBottom: 8 }}>
                    {verifyResult.ok ? `Verified — connected as ${verifyResult.displayName || "unknown"}.` : `Verification failed: ${verifyResult.detail || verifyResult.reason}`}
                  </div>
                )}
                <div style={{ display: "flex", gap: 8 }}>
                  {p.oauthAvailable && p.state === "ready_to_activate" && (
                    <a href={`/api/social/oauth/${p.platform}/start`}><Btn style={{ padding: "5px 12px", fontSize: 11.5 }}>Connect account</Btn></a>
                  )}
                  {p.oauthAvailable && p.state === "connected" && (
                    <>
                      <Btn variant="ghost" style={{ padding: "5px 12px", fontSize: 11.5 }} onClick={() => verify(p.platform)} disabled={busyPlatform === p.platform}>
                        {busyPlatform === p.platform ? "Verifying…" : "Verify connection"}
                      </Btn>
                      <Btn variant="ghost" style={{ padding: "5px 12px", fontSize: 11.5 }} onClick={() => disconnectPlatform(p.platform)} disabled={busyPlatform === p.platform}>Disconnect</Btn>
                    </>
                  )}
                  {(p.state === "waiting_for_credentials" || p.state === "configuration_required") && (
                    <Btn variant="ghost" disabled style={{ padding: "5px 12px", fontSize: 11.5, cursor: "not-allowed" }}>
                      {p.oauthAvailable ? "Set credentials above to activate" : "Not yet available"}
                    </Btn>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
