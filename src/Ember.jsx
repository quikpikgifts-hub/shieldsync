import React, { useState, useEffect, useRef } from "react";
import {
  Flame, Heart, X, ShieldCheck, MessageCircle, Mic, Video, MapPin,
  Sparkles, Lock, Check, ArrowRight, ArrowLeft, Camera, AlertTriangle,
  Eye, Star, Crown, Filter, Zap, LogOut, Loader2,
} from "lucide-react";
import * as api from "./emberApi";

// ─────────────────────────────────────────────────────────────
// DESIGN TOKENS — restrained, editorial, warm-dark
// ─────────────────────────────────────────────────────────────
const E = {
  bg: "#0B0809",
  surface: "#14100F",
  card: "#1B1516",
  cardH: "#221B1C",
  border: "#2C2224",
  borderH: "#4A3335",
  accent: "#FF6B4A",
  accentH: "#FF8A5B",
  accentB: "rgba(255,107,74,0.09)",
  accentGlow: "rgba(255,107,74,0.22)",
  rose: "#F5455C",
  gold: "#E8B466",
  goldB: "rgba(232,180,102,0.10)",
  green: "#3DD68C",
  text: "#FBEFEA",
  textSub: "#B99089",
  textDim: "#5C4046",
  serif: "'Fraunces', Georgia, serif",
  sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

const GRAIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,500&family=Inter:wght@400;500;600;700&display=swap');
*{box-sizing:border-box}
.em-root{background:${E.bg};color:${E.text};font-family:${E.sans};min-height:100vh;-webkit-font-smoothing:antialiased;position:relative}
.em-root ::-webkit-scrollbar{width:4px}
.em-root ::-webkit-scrollbar-thumb{background:${E.border};border-radius:2px}
.em-grain{position:fixed;inset:0;pointer-events:none;z-index:0;opacity:.035;mix-blend-mode:overlay;background-image:${GRAIN}}
.em-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;cursor:pointer;border:none;font-weight:600;font-family:${E.sans};transition:transform .15s ease,opacity .15s ease,border-color .15s ease}
.em-btn:hover{transform:translateY(-1px);opacity:.92}
.em-btn:active{transform:translateY(0)}
.em-card{transition:transform .2s ease,border-color .2s ease}
.em-card:hover{transform:translateY(-2px);border-color:${E.borderH}}
.em-fade{animation:emFade .4s cubic-bezier(.2,.7,.3,1)}
@keyframes emFade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes emPulse{0%,100%{opacity:1}50%{opacity:.4}}
@keyframes emSpin{to{transform:rotate(360deg)}}
.em-spin{width:15px;height:15px;border-radius:50%;border:2px solid ${E.border};border-top-color:${E.accent};animation:emSpin .7s linear infinite;display:inline-block;flex-shrink:0}
.em-spin-icon{animation:emSpin .8s linear infinite;display:inline-block}
input,textarea,select{font-family:${E.sans};color:${E.text};background:${E.card};border:1px solid ${E.border};border-radius:10px;padding:12px 14px;outline:none}
input:focus,textarea:focus,select:focus{border-color:${E.accent}}
input::placeholder,textarea::placeholder{color:${E.textDim}}
.em-num{font-variant-numeric:tabular-nums}
`;

// ─────────────────────────────────────────────────────────────
// MOCK DATA
// ─────────────────────────────────────────────────────────────
const INTENTS = [
  { id: "casual", label: "Casual", desc: "Low-key, see where it goes" },
  { id: "serious", label: "Serious", desc: "Looking for a relationship" },
  { id: "friendship", label: "Friendship-first", desc: "Connection before anything else" },
];

const PROMPTS = [
  "My ideal Sunday is...",
  "Two truths and a lie:",
  "I'll know it's a good date if...",
  "The way to my heart is...",
];

// Deterministic gradient per user id, since the real backend has no per-candidate art
// direction to send — this replaces what used to be a hardcoded `grad` field on mock data.
const CANDIDATE_GRADIENTS = [
  ["#3A2028", "#8A4030"],
  ["#2E1C22", "#C9962B"],
  ["#331E2E", "#B5562E"],
  ["#241C30", "#B5562E"],
  ["#33202A", "#8A4A38"],
];
function gradientForId(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return CANDIDATE_GRADIENTS[hash % CANDIDATE_GRADIENTS.length];
}

const FEATURES = [
  { icon: ShieldCheck, title: "Identity & Trust", items: ["Liveness-checked photo verification", "One account per phone number", "Reports reviewed by a person, within 24h"] },
  { icon: Heart, title: "Matching", items: ["A curated batch each day, not endless scroll", "Intent declared up front", "Compatibility drawn from your own answers"] },
  { icon: MessageCircle, title: "Conversation", items: ["Icebreakers instead of “hey”", "Voice notes and a video call before contact info", "Read receipts, kept as a paid courtesy"] },
  { icon: MapPin, title: "Safety", items: ["Time-boxed live location on dates", "A check-in prompt afterward", "One tap to alert a trusted contact"] },
];

const TESTIMONIALS = [
  { quote: "The first app where a conversation didn't feel like homework.", who: "R. — member since 2025" },
  { quote: "Three matches a day sounds like nothing until you meet all three.", who: "S. — member since 2026" },
  { quote: "My matchmaker caught something in my profile I couldn't see myself.", who: "J. — Ember Black member" },
];

const PRICING = [
  { id: "free", name: "Free", price: "$0", note: "/mo", features: ["Limited daily matches", "Basic messaging", "Ads between screens"] },
  { id: "plus", name: "Ember+", price: "$19.99", note: "/mo", highlight: true, features: ["Unlimited matches", "See who liked you", "Read receipts", "No ads"] },
  { id: "gold", name: "Ember Gold", price: "$39.99", note: "/mo", features: ["Everything in +", "Priority placement", "Advanced filters", "Monthly human profile review"] },
];

const ALACARTE = [
  { label: "Boost", price: "$4.99" },
  { label: "Super Like (bundle)", price: "$1.99 ea" },
  { label: "ID verification badge", price: "$9.99 one-time" },
];


// ─────────────────────────────────────────────────────────────
// PRIMITIVES
// ─────────────────────────────────────────────────────────────
function Btn({ children, onClick, variant = "primary", style, disabled, ...rest }) {
  const base = { padding: "13px 22px", borderRadius: 11, fontSize: 15 };
  const variants = {
    primary: { background: `linear-gradient(135deg, ${E.accent}, ${E.rose})`, color: "#1A0A08", boxShadow: `0 6px 20px ${E.accentGlow}` },
    ghost: { background: "transparent", color: E.text, border: `1px solid ${E.border}` },
    obsidian: { background: E.surface, color: E.gold, border: `1px solid rgba(232,180,102,0.4)` },
    danger: { background: E.rose, color: "#fff" },
  };
  return (
    <button
      className="em-btn"
      disabled={disabled}
      onClick={onClick}
      style={{ ...base, ...variants[variant], opacity: disabled ? 0.4 : 1, cursor: disabled ? "not-allowed" : "pointer", ...style }}
      {...rest}
    >
      {children}
    </button>
  );
}

function Card({ children, style }) {
  return (
    <div className="em-card" style={{ background: E.card, border: `1px solid ${E.border}`, borderRadius: 16, padding: 20, ...style }}>
      {children}
    </div>
  );
}

function Avatar({ name, size = 56, gradient }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: gradient || `linear-gradient(135deg, ${E.accent}, ${E.rose})`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: E.serif, fontWeight: 600, fontSize: size * 0.4, color: "#1A0A08", flexShrink: 0,
    }}>
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
}

function PrototypeNav({ screen, setScreen, authUser, onLogout }) {
  const steps = [["signup", "Apply"], ["login", "Log in"], ["review", "Review"], ["profile", "Profile"], ["matches", "Matches"], ["likes", "Likes"], ["filters", "Filters"], ["chat", "Chat"], ["safety", "Safety"]];
  if (screen === "landing") return null;
  return (
    <div style={{
      position: "fixed", bottom: 16, left: "50%", transform: "translateX(-50%)",
      display: "flex", gap: 4, background: "rgba(20,16,15,0.92)", backdropFilter: "blur(12px)",
      border: `1px solid ${E.border}`, borderRadius: 999, padding: 6, zIndex: 200, flexWrap: "wrap",
      justifyContent: "center", maxWidth: "94vw",
    }}>
      <button onClick={() => setScreen("landing")} className="em-btn" style={{
        padding: "8px 13px", borderRadius: 999, background: "transparent", color: E.textSub, fontSize: 11.5, letterSpacing: ".02em",
      }}>Landing</button>
      {steps.map(([id, label]) => (
        <button key={id} onClick={() => setScreen(id)} className="em-btn" style={{
          padding: "8px 13px", borderRadius: 999, fontSize: 11.5, letterSpacing: ".02em",
          background: screen === id ? E.accent : "transparent",
          color: screen === id ? "#1A0A08" : E.textSub,
        }}>{label}</button>
      ))}
      {authUser && (
        <button onClick={onLogout} className="em-btn" style={{
          padding: "8px 13px", borderRadius: 999, background: "transparent", color: E.rose, fontSize: 11.5, letterSpacing: ".02em",
        }}><LogOut size={12} /> Log out</button>
      )}
    </div>
  );
}

function TierSwitcher({ screen, tier, setTier }) {
  if (screen === "landing") return null;
  const tiers = [["free", "Free"], ["plus", "Ember+"], ["gold", "Gold"], ["black", "Black"]];
  return (
    <div style={{
      position: "fixed", bottom: 64, left: "50%", transform: "translateX(-50%)",
      display: "flex", alignItems: "center", gap: 4, background: "rgba(20,16,15,0.92)", backdropFilter: "blur(12px)",
      border: `1px solid ${E.border}`, borderRadius: 999, padding: 6, zIndex: 200, flexWrap: "wrap",
      justifyContent: "center", maxWidth: "94vw",
    }}>
      <span style={{ padding: "0 8px", fontSize: 10, color: E.textDim, letterSpacing: ".06em" }}>DEMO PLAN</span>
      {tiers.map(([id, label]) => (
        <button key={id} onClick={() => setTier(id)} className="em-btn" style={{
          padding: "7px 12px", borderRadius: 999, fontSize: 11.5,
          background: tier === id ? E.gold : "transparent",
          color: tier === id ? "#1A0A08" : E.textSub,
        }}>{label}</button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// LANDING
// ─────────────────────────────────────────────────────────────
function Landing({ setScreen, setTier, authUser }) {
  const goProtected = (target) => setScreen(authUser ? target : "signup");

  return (
    <div className="em-fade">
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "22px 6vw" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: E.serif, fontSize: 23, fontWeight: 600 }}>
          <Flame size={20} color={E.accent} /> Ember
        </div>
        {authUser ? (
          <Btn onClick={() => setScreen("matches")}>Continue as {authUser.email}</Btn>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <button onClick={() => setScreen("login")} className="em-btn" style={{ padding: 0, background: "transparent", color: E.textSub, fontSize: 13.5 }}>
              Log in
            </button>
            <Btn onClick={() => setScreen("signup")}>Request an Invite</Btn>
          </div>
        )}
      </nav>

      <section style={{ textAlign: "center", padding: "72px 6vw 56px", maxWidth: 760, margin: "0 auto" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 999,
          background: E.accentB, color: E.accent, fontSize: 12.5, fontWeight: 600, marginBottom: 26, letterSpacing: ".01em",
        }}>
          <Sparkles size={13} /> Membership by application
        </div>
        <h1 style={{ fontFamily: E.serif, fontWeight: 500, fontSize: "clamp(36px,6vw,58px)", lineHeight: 1.08, margin: "0 0 20px", letterSpacing: "-0.01em" }}>
          Matched with intention.
        </h1>
        <p style={{ color: E.textSub, fontSize: 17, lineHeight: 1.65, marginBottom: 36, maxWidth: 520, marginLeft: "auto", marginRight: "auto" }}>
          A small, curated batch of real matches each day — reviewed by people, not just an algorithm.
          Built to last longer than the chat.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Btn onClick={() => setScreen("signup")}>Request an Invite <ArrowRight size={16} /></Btn>
          <Btn variant="ghost" onClick={() => goProtected("matches")}>{authUser ? "See today's matches" : "Sign up to see matches"}</Btn>
        </div>
      </section>

      <section style={{ padding: "10px 6vw 64px", maxWidth: 1080, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px,1fr))", gap: 16 }}>
          {FEATURES.map(f => (
            <Card key={f.title}>
              <f.icon size={19} color={E.accent} style={{ marginBottom: 12 }} />
              <div style={{ fontFamily: E.serif, fontWeight: 500, fontSize: 17, marginBottom: 12 }}>{f.title}</div>
              <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 9 }}>
                {f.items.map(i => (
                  <li key={i} style={{ color: E.textSub, fontSize: 13.5, lineHeight: 1.5, display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <Check size={13} color={E.green} style={{ marginTop: 3, flexShrink: 0 }} />{i}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </section>

      <section style={{ padding: "10px 6vw 70px", maxWidth: 980, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 40, alignItems: "center" }}>
          <div>
            <div style={{ color: E.gold, fontSize: 12.5, fontWeight: 700, letterSpacing: ".08em", marginBottom: 10 }}>WHITE-GLOVE MATCHING</div>
            <h2 style={{ fontFamily: E.serif, fontWeight: 500, fontSize: "clamp(26px,3vw,34px)", lineHeight: 1.2, margin: "0 0 14px" }}>
              A team behind every match.
            </h2>
            <p style={{ color: E.textSub, fontSize: 15, lineHeight: 1.7 }}>
              Gold members get a monthly profile consultation. Ember Black members get a dedicated
              matchmaker who reviews compatibility by hand before it ever reaches your batch.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {["Human-reviewed profiles before they go live", "Dedicated matchmaker for Black members", "Monthly consultation for Gold members"].map(t => (
              <div key={t} style={{ display: "flex", gap: 10, alignItems: "center", padding: "12px 16px", background: E.surface, border: `1px solid ${E.border}`, borderRadius: 12 }}>
                <Crown size={15} color={E.gold} style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 13.5 }}>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: "10px 6vw 70px", maxWidth: 980, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px,1fr))", gap: 22 }}>
          {TESTIMONIALS.map(t => (
            <div key={t.quote}>
              <div style={{ fontFamily: E.serif, fontStyle: "italic", fontSize: 17, lineHeight: 1.5, marginBottom: 10 }}>"{t.quote}"</div>
              <div style={{ color: E.textDim, fontSize: 12.5 }}>{t.who}</div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ padding: "10px 6vw 40px", maxWidth: 1080, margin: "0 auto" }}>
        <h2 style={{ textAlign: "center", fontFamily: E.serif, fontWeight: 500, fontSize: 28, marginBottom: 6 }}>Pick your tier</h2>
        <p style={{ textAlign: "center", color: E.textSub, marginBottom: 32 }}>Annual plans save 20%.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))", gap: 16, marginBottom: 20 }}>
          {PRICING.map(t => (
            <Card key={t.name} style={t.highlight ? { border: `1px solid ${E.accent}` } : {}}>
              {t.highlight && (
                <div style={{ color: E.accent, fontSize: 10.5, fontWeight: 700, letterSpacing: ".08em", marginBottom: 10 }}>MOST POPULAR</div>
              )}
              <div style={{ fontFamily: E.serif, fontWeight: 500, fontSize: 19, marginBottom: 6 }}>{t.name}</div>
              <div style={{ marginBottom: 16 }}>
                <span className="em-num" style={{ fontFamily: E.serif, fontSize: 30, fontWeight: 500 }}>{t.price}</span>
                <span style={{ color: E.textSub, fontSize: 13 }}>{t.note}</span>
              </div>
              <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 9, marginBottom: 16 }}>
                {t.features.map(f => (
                  <li key={f} style={{ color: E.textSub, fontSize: 13.5, display: "flex", gap: 8 }}>
                    <Check size={13} color={E.green} style={{ marginTop: 3, flexShrink: 0 }} />{f}
                  </li>
                ))}
              </ul>
              <button onClick={() => { setTier(t.id); goProtected(t.id === "free" ? "matches" : "likes"); }} className="em-btn" style={{
                padding: 0, background: "transparent", color: E.accent, fontSize: 12.5, fontWeight: 600,
              }}>See this tier in action <ArrowRight size={12} /></button>
            </Card>
          ))}
        </div>

        <Card style={{ borderColor: "rgba(232,180,102,0.35)", background: `linear-gradient(135deg, ${E.card}, ${E.surface})` }}>
          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 20, alignItems: "center" }}>
            <Crown size={26} color={E.gold} />
            <div>
              <div style={{ fontFamily: E.serif, fontWeight: 500, fontSize: 19, color: E.gold }}>Ember Black</div>
              <div style={{ color: E.textSub, fontSize: 13.5, marginTop: 3 }}>Invite-only. A dedicated matchmaker, unlimited boosts, and a guaranteed weekly hand-picked introduction.</div>
            </div>
            <Btn variant="obsidian" onClick={() => { setTier("black"); setScreen("signup"); }}>Apply for Black</Btn>
          </div>
        </Card>

        <div style={{ display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap", marginTop: 26, color: E.textSub, fontSize: 13.5 }}>
          {ALACARTE.map(a => <div key={a.label}><b style={{ color: E.text }}>{a.price}</b> {a.label}</div>)}
        </div>
      </section>

      <footer style={{ textAlign: "center", padding: "30px 6vw 50px", color: E.textDim, fontSize: 12.5, borderTop: `1px solid ${E.border}` }}>
        Ember is a product prototype. Accounts, matches, and messages are stored for real
        against a development backend — no photo/video storage, payments, or identity
        verification are connected to a real vendor yet.
      </footer>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SIGNUP (application)
// ─────────────────────────────────────────────────────────────
function Signup({ setScreen, profile, setProfile, setAuthUser, initialMode }) {
  const [mode, setMode] = useState(initialMode || "register"); // "register" | "login"
  const [intent, setIntent] = useState(profile.intent);
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email || "");
  const [password, setPassword] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState(profile.dateOfBirth || "");
  const [maxDistance, setMaxDistance] = useState(profile.maxDistance);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const canContinue = mode === "login"
    ? email.trim().length > 0 && password.length > 0
    : name.trim().length > 0 && intent && email.trim().length > 0 && password.length >= 10 && dateOfBirth;

  async function submit() {
    setSubmitting(true);
    setError("");
    try {
      if (mode === "login") {
        const user = await api.login({ email, password });
        setAuthUser(user);
        setScreen("matches");
        return;
      }
      const user = await api.register({ email, password, dateOfBirth });
      setAuthUser(user);
      setProfile(p => ({ ...p, name, email, dateOfBirth, intent, maxDistance }));
      setScreen("review");
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (mode === "login") {
    return (
      <Screen title="Log in" subtitle="Welcome back." onBack={() => setScreen("landing")}>
        <Card style={{ maxWidth: 420, margin: "0 auto" }}>
          <label style={fieldLabel}>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" style={{ width: "100%", marginBottom: 18 }} />
          <label style={fieldLabel}>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••••" style={{ width: "100%", marginBottom: 18 }}
            onKeyDown={e => e.key === "Enter" && canContinue && submit()} />
          {error && <div style={{ color: E.rose, fontSize: 13, marginBottom: 14 }}>{error}</div>}
          <Btn disabled={!canContinue || submitting} style={{ width: "100%", marginBottom: 14 }} onClick={submit}>
            {submitting ? <Loader2 size={16} className="em-spin-icon" /> : <>Log in <ArrowRight size={16} /></>}
          </Btn>
          <button onClick={() => { setMode("register"); setError(""); }} className="em-btn" style={{ width: "100%", padding: 0, background: "transparent", color: E.textSub, fontSize: 13 }}>
            New here? Apply for membership
          </button>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen title="Apply for membership" subtitle="Every application is reviewed to keep the community intentional." onBack={() => setScreen("landing")}>
      <Card style={{ maxWidth: 520, margin: "0 auto" }}>
        <div style={{ textAlign: "right", marginBottom: 10 }}>
          <button onClick={() => { setMode("login"); setError(""); }} className="em-btn" style={{ padding: 0, background: "transparent", color: E.accent, fontSize: 13 }}>
            Already a member? Log in
          </button>
        </div>
        <label style={fieldLabel}>Name</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" style={{ width: "100%", marginBottom: 18 }} />

        <label style={fieldLabel}>Email</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" style={{ width: "100%", marginBottom: 18 }} />

        <label style={fieldLabel}>Password — at least 10 characters, with a letter and a number</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••••" style={{ width: "100%", marginBottom: 18 }} />

        <label style={fieldLabel}>Date of birth — you must be 18 or older</label>
        <input type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} style={{ width: "100%", marginBottom: 18 }} />

        <label style={fieldLabel}>Intent — required</label>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
          {INTENTS.map(i => (
            <button key={i.id} onClick={() => setIntent(i.id)} className="em-btn" style={{
              justifyContent: "flex-start", textAlign: "left", padding: "12px 14px", borderRadius: 10,
              background: intent === i.id ? E.accentB : "transparent",
              border: `1px solid ${intent === i.id ? E.accent : E.border}`,
              color: E.text, flexDirection: "column", alignItems: "flex-start", gap: 2,
            }}>
              <span style={{ fontWeight: 600 }}>{i.label}</span>
              <span style={{ color: E.textSub, fontWeight: 400, fontSize: 12.5 }}>{i.desc}</span>
            </button>
          ))}
        </div>

        <label style={fieldLabel}>Max distance: {maxDistance} mi</label>
        <input type="range" min="1" max="50" value={maxDistance} onChange={e => setMaxDistance(e.target.value)} style={{ width: "100%", marginBottom: 16, padding: 0, background: "transparent" }} />

        {error && <div style={{ color: E.rose, fontSize: 13, marginBottom: 14 }}>{error}</div>}

        <Btn disabled={!canContinue || submitting} style={{ width: "100%" }} onClick={submit}>
          {submitting ? <Loader2 size={16} className="em-spin-icon" /> : <>Submit application <ArrowRight size={16} /></>}
        </Btn>
      </Card>
    </Screen>
  );
}

// ─────────────────────────────────────────────────────────────
// REVIEW (application vetting, then reveal)
// ─────────────────────────────────────────────────────────────
function Review({ setScreen, profile }) {
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const checks = [
    "Verifying phone number",
    "Confirming one account per person",
    "Matching intent & preferences",
    "Queuing your profile for human review",
  ];

  useEffect(() => {
    if (step >= checks.length) return;
    const t = setTimeout(() => setStep(s => s + 1), 550);
    return () => clearTimeout(t);
  }, [step]);

  const done = step >= checks.length;

  async function continueToProfile(setScreenFn) {
    setError("");
    try {
      // The animated checklist above is pure UI flourish — there is no backend concept
      // of "application review." What's real is creating the actual profile + match
      // preferences record now that the account itself exists.
      await api.upsertProfile({ displayName: profile.name, intent: intentToEnum(profile.intent) });
      if (profile.maxDistance) {
        await api.upsertPreferences({ maxDistanceKm: Number(profile.maxDistance) });
      }
      setScreenFn("profile");
    } catch (err) {
      setError(err.message || "Couldn't save your profile — please try again.");
    }
  }

  return (
    <Screen title="Reviewing your application" onBack={() => setScreen("signup")}>
      <Card style={{ maxWidth: 460, margin: "0 auto" }}>
        {!done ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {checks.map((c, i) => (
              <div key={c} style={{ display: "flex", alignItems: "center", gap: 12, opacity: i <= step ? 1 : 0.35, transition: "opacity .3s" }}>
                {i < step ? <Check size={16} color={E.green} style={{ flexShrink: 0 }} /> : i === step ? <span className="em-spin" /> : <span style={{ width: 15, flexShrink: 0 }} />}
                <span style={{ fontSize: 14 }}>{c}</span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "6px 0" }}>
            <div style={{ fontFamily: E.serif, fontWeight: 500, fontSize: 26, marginBottom: 10 }}>
              You're in{profile.name ? `, ${profile.name}` : ""}.
            </div>
            <p style={{ color: E.textSub, fontSize: 14, lineHeight: 1.6, marginBottom: 22 }}>
              Ember is intentionally small. Welcome to a more deliberate way to meet people.
            </p>
            {error && <div style={{ color: E.rose, fontSize: 13, marginBottom: 14 }}>{error}</div>}
            <Btn style={{ width: "100%" }} onClick={() => continueToProfile(setScreen)}>Continue to your profile <ArrowRight size={16} /></Btn>
          </div>
        )}
      </Card>
    </Screen>
  );
}

function intentToEnum(intentId) {
  return { casual: "CASUAL", serious: "SERIOUS", friendship: "FRIENDSHIP" }[intentId] ?? undefined;
}

// ─────────────────────────────────────────────────────────────
// PROFILE
// ─────────────────────────────────────────────────────────────
function Profile({ setScreen, profile, setProfile }) {
  const [photos, setPhotos] = useState(profile.photos.length ? profile.photos : [false, false, false, false]);
  const [answers, setAnswers] = useState(profile.answers || {});
  const [verify, setVerify] = useState(profile.verify || false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setSaving(true);
    setError("");
    try {
      const entries = PROMPTS.slice(0, 2)
        .filter(p => (answers[p] || "").trim().length > 0)
        .map(p => ({ promptKey: p, answer: answers[p].trim() }));
      if (entries.length > 0) {
        await api.upsertPromptAnswers(entries);
      }
      setProfile(p => ({ ...p, photos, answers, verify }));
      setScreen("matches");
    } catch (err) {
      setError(err.message || "Couldn't save your answers — please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen title="Build your profile" subtitle="Our team reviews every profile by hand before it goes live." onBack={() => setScreen("review")}>
      <Card style={{ maxWidth: 560, margin: "0 auto" }}>
        <label style={fieldLabel}>Photos</label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 8 }}>
          {photos.map((added, i) => (
            <button key={i} onClick={() => setPhotos(p => p.map((v, idx) => idx === i ? !v : v))} className="em-btn" style={{
              aspectRatio: "1", borderRadius: 12, background: added ? E.accentB : E.surface,
              border: `1px dashed ${added ? E.accent : E.border}`, color: added ? E.accent : E.textDim,
            }}>
              {added ? <Check size={18} /> : <Camera size={18} />}
            </button>
          ))}
        </div>
        <div style={{ color: E.textDim, fontSize: 11.5, marginBottom: 20 }}>
          Demo only — photo upload isn't connected to real storage yet.
        </div>

        <label style={fieldLabel}>Answer a few prompts</label>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
          {PROMPTS.slice(0, 2).map(p => (
            <div key={p}>
              <div style={{ fontSize: 13, color: E.textSub, marginBottom: 6 }}>{p}</div>
              <textarea
                rows={2} placeholder="Your answer..."
                value={answers[p] || ""}
                onChange={e => setAnswers(a => ({ ...a, [p]: e.target.value }))}
                style={{ width: "100%", resize: "none" }}
              />
            </div>
          ))}
        </div>

        <button onClick={() => setVerify(v => !v)} className="em-btn" style={{
          width: "100%", justifyContent: "space-between", padding: "14px 16px", borderRadius: 12,
          background: verify ? E.accentB : E.surface, border: `1px solid ${verify ? E.accent : E.border}`,
          color: E.text, marginBottom: 8,
        }}>
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ShieldCheck size={16} color={verify ? E.accent : E.textSub} />
            ID verification badge
          </span>
          <span style={{ color: E.gold, fontSize: 12.5, fontWeight: 700 }}>{verify ? "Added · $9.99" : "+$9.99"}</span>
        </button>
        <div style={{ color: E.textDim, fontSize: 11.5, marginBottom: 22 }}>
          Demo only — no real identity-verification vendor or payment is connected yet.
        </div>

        {error && <div style={{ color: E.rose, fontSize: 13, marginBottom: 14 }}>{error}</div>}

        <Btn disabled={saving} style={{ width: "100%" }} onClick={submit}>
          {saving ? <Loader2 size={16} className="em-spin-icon" /> : <>See today's matches <ArrowRight size={16} /></>}
        </Btn>
      </Card>
    </Screen>
  );
}

// ─────────────────────────────────────────────────────────────
// MATCHES
// ─────────────────────────────────────────────────────────────
function Matches({ setScreen, likedIds, setLikedIds, superLikedIds, setSuperLikedIds, setActiveMatch, tier, boostActive, boostSeconds, startBoost, viewerId }) {
  const [candidates, setCandidates] = useState([]);
  const [existingMatches, setExistingMatches] = useState([]);
  const [likesCount, setLikesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [pendingId, setPendingId] = useState(null);

  const dailyCap = tier === "free" ? 3 : Infinity;
  const remaining = Math.max(0, dailyCap - likedIds.length);
  const limitHit = likedIds.length >= dailyCap;

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.listCandidates(), api.listLikesReceived(), api.listMatches()])
      .then(async ([candidateList, likes, matches]) => {
        if (cancelled) return;
        setCandidates(candidateList);
        setLikesCount(likes.length);

        // listMatches() returns the match rows only (no profile info) — hydrate each
        // with the other person's display profile, dropping any that fail (e.g. a
        // profile that's since become invisible or blocked).
        const hydrated = await Promise.all(matches.map(async (m) => {
          const otherUserId = m.userAId === viewerId ? m.userBId : m.userAId;
          try {
            const profile = await api.getProfile(otherUserId);
            return { matchId: m.id, userId: otherUserId, displayName: profile.displayName, verifiedBadge: profile.verifiedBadge };
          } catch {
            return null;
          }
        }));
        if (!cancelled) setExistingMatches(hydrated.filter(Boolean));
      })
      .catch(err => { if (!cancelled) setError(err.message || "Couldn't load matches."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [viewerId]);

  async function decide(candidate, action) {
    setPendingId(candidate.userId);
    setError("");
    try {
      const result = await api.decide(candidate.userId, action);
      setLikedIds(ids => [...ids, candidate.userId]);
      if (action === "SUPER_LIKE") setSuperLikedIds(ids => [...ids, candidate.userId]);
      setCandidates(list => list.filter(c => c.userId !== candidate.userId));

      if (result.match) {
        setActiveMatch({ ...candidate, matchId: result.match.id, superLiked: action === "SUPER_LIKE" });
        setScreen("chat");
      } else if (action !== "PASS") {
        setToast(`Liked ${candidate.displayName} — you'll be notified if it's a match.`);
        setTimeout(() => setToast(""), 2500);
      }
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <Screen title="Today's curated matches" subtitle="Hand-picked by Ember's matching team." onBack={() => setScreen("profile")}>
      <div style={{ maxWidth: 520, margin: "0 auto 16px", display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
        <Btn variant="ghost" style={{ padding: "8px 14px", fontSize: 12.5 }} onClick={() => setScreen("filters")}>
          <Filter size={13} /> Filters
        </Btn>
        <Btn variant="ghost" style={{ padding: "8px 14px", fontSize: 12.5 }} onClick={() => setScreen("likes")}>
          <Heart size={13} /> Who liked you · {likesCount}
        </Btn>
        <Btn variant={boostActive ? "primary" : "ghost"} disabled={boostActive} style={{ padding: "8px 14px", fontSize: 12.5 }} onClick={startBoost}>
          <Zap size={13} /> {boostActive ? `Boosted · ${boostSeconds}s` : "Boost · $4.99"}
        </Btn>
      </div>
      <div style={{ maxWidth: 520, margin: "0 auto", textAlign: "center", color: E.textSub, fontSize: 13.5, marginBottom: 18 }}>
        {tier === "free"
          ? (limitHit ? "You've seen today's free batch — Ember+ unlocks unlimited matches." : `${remaining} of ${dailyCap} daily matches remaining`)
          : "Unlimited matches today."}
      </div>

      {toast && (
        <div style={{ maxWidth: 520, margin: "0 auto 14px", textAlign: "center", color: E.green, fontSize: 13 }}>{toast}</div>
      )}
      {error && (
        <div style={{ maxWidth: 520, margin: "0 auto 14px", textAlign: "center", color: E.rose, fontSize: 13 }}>{error}</div>
      )}

      {!loading && existingMatches.length > 0 && (
        <div style={{ maxWidth: 520, margin: "0 auto 24px" }}>
          <div style={{ fontSize: 12, color: E.textSub, marginBottom: 10, letterSpacing: ".03em" }}>YOUR MATCHES</div>
          <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
            {existingMatches.map(m => (
              <button
                key={m.matchId}
                onClick={() => { setActiveMatch(m); setScreen("chat"); }}
                className="em-btn"
                style={{ flexDirection: "column", gap: 6, background: "transparent", flexShrink: 0, width: 68 }}
              >
                <Avatar name={m.displayName} size={52} gradient={`linear-gradient(135deg, ${gradientForId(m.userId)[0]}, ${gradientForId(m.userId)[1]})`} />
                <span style={{ fontSize: 11, color: E.textSub, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 68 }}>{m.displayName}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: 40 }}><Loader2 size={22} className="em-spin-icon" color={E.textSub} /></div>
      ) : candidates.length === 0 ? (
        <Card style={{ maxWidth: 480, margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontFamily: E.serif, fontSize: 17, marginBottom: 6 }}>No one new right now</div>
          <p style={{ color: E.textSub, fontSize: 13.5 }}>
            Check back soon, or widen your filters — try Filters above.
          </p>
        </Card>
      ) : (
        <div style={{ maxWidth: 520, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
          {candidates.map(c => {
            const grad = gradientForId(c.userId);
            const pending = pendingId === c.userId;
            return (
              <Card key={c.userId} style={{ padding: 0, overflow: "hidden" }}>
                <div style={{ position: "relative", height: 150, background: `linear-gradient(150deg, ${grad[0]}, ${grad[1]})` }}>
                  <div className="em-grain" style={{ position: "absolute" }} />
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,.72), transparent 60%)" }} />
                  <div style={{ position: "absolute", left: 16, right: 16, bottom: 12, display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: E.serif, fontSize: 21, color: "#fff" }}>
                      {c.displayName}{c.age ? `, ${c.age}` : ""} {c.verifiedBadge && <ShieldCheck size={14} color={E.gold} />}
                    </div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,.85)" }}>{c.city || ""}</div>
                  </div>
                </div>
                <div style={{ padding: 18 }}>
                  {c.intent && (
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
                      <span style={{ fontSize: 11, background: E.accentB, color: E.accent, padding: "2px 8px", borderRadius: 999, fontWeight: 600 }}>{c.intent}</span>
                    </div>
                  )}
                  {c.bio && (
                    <div style={{ color: E.text, fontSize: 13.5, lineHeight: 1.5, marginBottom: 8 }}>{c.bio}</div>
                  )}
                  <div style={{ color: E.textSub, fontSize: 13.5, fontFamily: E.serif, fontStyle: "italic", lineHeight: 1.5, marginBottom: 16 }}>
                    {c.promptAnswers[0] ? `"${c.promptAnswers[0].answer}"` : "No prompts answered yet."}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Btn variant="ghost" style={{ flex: 1 }} disabled={pending} onClick={() => decide(c, "PASS")}>
                      <X size={16} /> Pass
                    </Btn>
                    <Btn variant="obsidian" style={{ flex: "0 0 auto", padding: "13px 15px" }} disabled={pending} onClick={() => decide(c, "SUPER_LIKE")} title="Super Like — $1.99">
                      <Star size={16} />
                    </Btn>
                    <Btn style={{ flex: 1 }} disabled={pending || limitHit} onClick={() => decide(c, "LIKE")}>
                      {pending ? <Loader2 size={16} className="em-spin-icon" /> : <><Heart size={16} /> Like</>}
                    </Btn>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </Screen>
  );
}

// ─────────────────────────────────────────────────────────────
// CHAT
// ─────────────────────────────────────────────────────────────
function Chat({ setScreen, activeMatch, isPaid, viewerId }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState("");
  const [recording, setRecording] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    if (!activeMatch) { setLoading(false); return; }
    let cancelled = false;
    api.listMessages(activeMatch.matchId)
      .then(res => { if (!cancelled) setMessages(res.items); })
      .catch(err => { if (!cancelled) setError(err.message || "Couldn't load messages."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [activeMatch]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function send() {
    if (!draft.trim() || !activeMatch) return;
    const body = draft;
    setDraft("");
    try {
      const message = await api.sendMessage(activeMatch.matchId, { kind: "TEXT", body });
      setMessages(m => [...m, message]);
    } catch (err) {
      setError(err.message || "Message failed to send.");
    }
  }

  async function sendVoiceNote() {
    if (!activeMatch) return;
    setRecording(true);
    setTimeout(async () => {
      setRecording(false);
      try {
        const message = await api.sendMessage(activeMatch.matchId, { kind: "VOICE", mediaStorageKey: `demo-voice-${Date.now()}` });
        setMessages(m => [...m, message]);
      } catch (err) {
        setError(err.message || "Voice note failed to send.");
      }
    }, 1200);
  }

  if (!activeMatch) {
    return (
      <Screen title="Chat" onBack={() => setScreen("matches")}>
        <Card style={{ maxWidth: 480, margin: "0 auto", textAlign: "center" }}>
          <p style={{ color: E.textSub, fontSize: 14 }}>No conversation selected — like someone back to start a real match, then open it from here.</p>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen title={`Chat with ${activeMatch.displayName}`} onBack={() => setScreen("matches")}>
      <Card style={{ maxWidth: 560, margin: "0 auto", display: "flex", flexDirection: "column", height: 480, padding: 0, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 14, borderBottom: `1px solid ${E.border}` }}>
          <Avatar name={activeMatch.displayName} size={40} gradient={`linear-gradient(135deg, ${gradientForId(activeMatch.userId)[0]}, ${gradientForId(activeMatch.userId)[1]})`} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: E.serif, fontWeight: 500, fontSize: 15, display: "flex", alignItems: "center", gap: 5 }}>
              {activeMatch.displayName} {activeMatch.verifiedBadge && <ShieldCheck size={13} color={E.gold} />}
            </div>
            {activeMatch.superLiked && <div style={{ fontSize: 11.5, color: E.gold }}>You Super Liked them</div>}
          </div>
          <button className="em-btn" title="Share contact info unlocks after a video call" style={{
            background: E.surface, border: `1px solid ${E.border}`, color: E.textSub, padding: "8px 12px", borderRadius: 999, fontSize: 12,
          }}>
            <Video size={14} /> Video-call to meet
          </button>
        </div>

        {activeMatch.promptAnswers?.[0] && (
          <div style={{ padding: "10px 16px", borderBottom: `1px solid ${E.border}`, background: E.surface }}>
            <div style={{ fontSize: 10.5, color: E.accent, marginBottom: 3, display: "flex", alignItems: "center", gap: 4, letterSpacing: ".04em" }}>
              <Sparkles size={11} /> ICEBREAKER PROMPT
            </div>
            <div style={{ fontSize: 13, fontFamily: E.serif, fontStyle: "italic", color: E.textSub }}>
              "{activeMatch.promptAnswers[0].answer}"
            </div>
          </div>
        )}

        <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: 20 }}><Loader2 size={18} className="em-spin-icon" color={E.textSub} /></div>
          ) : messages.length === 0 ? (
            <div style={{ textAlign: "center", color: E.textDim, fontSize: 13, padding: 20 }}>Say hello — this is a real conversation.</div>
          ) : messages.map((m) => {
            const mine = m.senderId === viewerId;
            return (
              <div key={m.id} style={{ alignSelf: mine ? "flex-end" : "flex-start", maxWidth: "80%" }}>
                <div style={{
                  background: mine ? `linear-gradient(135deg, ${E.accent}, ${E.rose})` : E.surface,
                  color: mine ? "#1A0A08" : E.text,
                  padding: "10px 14px", borderRadius: 14, fontSize: 14,
                  display: "flex", alignItems: "center", gap: 6,
                }}>
                  {m.kind === "VOICE" ? <><Mic size={14} /> Voice note</> : m.body}
                </div>
                {mine && (
                  <div style={{ fontSize: 10.5, color: E.textDim, marginTop: 3, display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end" }}>
                    {isPaid ? <>Seen</> : <><Lock size={9} /> Seen — Ember+ only</>}
                  </div>
                )}
              </div>
            );
          })}
          <div ref={endRef} />
        </div>

        {error && <div style={{ padding: "0 16px 8px", color: E.rose, fontSize: 12.5 }}>{error}</div>}

        <div style={{ display: "flex", gap: 8, padding: 12, borderTop: `1px solid ${E.border}` }}>
          <button onClick={sendVoiceNote} className="em-btn" style={{
            background: recording ? E.rose : E.surface, border: `1px solid ${E.border}`, borderRadius: "50%", width: 42, height: 42, color: recording ? "#fff" : E.textSub, flexShrink: 0,
            animation: recording ? "emPulse .8s infinite" : "none",
          }}>
            <Mic size={16} />
          </button>
          <input
            value={draft} onChange={e => setDraft(e.target.value)}
            onKeyDown={e => e.key === "Enter" && send()}
            placeholder="Type a message..." style={{ flex: 1 }}
          />
          <Btn onClick={send} style={{ padding: "0 18px" }}>Send</Btn>
        </div>
      </Card>

      <div style={{ maxWidth: 560, margin: "16px auto 0", textAlign: "center" }}>
        <Btn variant="ghost" onClick={() => setScreen("safety")}><MapPin size={15} /> Planning to meet up? Set up date safety</Btn>
      </div>
    </Screen>
  );
}

// ─────────────────────────────────────────────────────────────
// LIKES (who liked you — Ember+ feature)
// ─────────────────────────────────────────────────────────────
function Likes({ setScreen, tier, setTier }) {
  const unlocked = tier !== "free";
  const [likes, setLikes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    api.listLikesReceived()
      .then(res => { if (!cancelled) setLikes(res); })
      .catch(err => { if (!cancelled) setError(err.message || "Couldn't load likes."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <Screen title="Who liked you" subtitle={unlocked ? "They already said yes — it's your move." : "Unlock to see who's interested."} onBack={() => setScreen("matches")}>
      {loading ? (
        <div style={{ textAlign: "center", padding: 40 }}><Loader2 size={22} className="em-spin-icon" color={E.textSub} /></div>
      ) : error ? (
        <div style={{ textAlign: "center", color: E.rose, fontSize: 13 }}>{error}</div>
      ) : likes.length === 0 ? (
        <Card style={{ maxWidth: 420, margin: "0 auto", textAlign: "center" }}>
          <p style={{ color: E.textSub, fontSize: 13.5 }}>No one has liked you yet — check back after your profile's been seen a bit more.</p>
        </Card>
      ) : (
        <div style={{ maxWidth: 520, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px,1fr))", gap: 14 }}>
          {likes.map(l => {
            const grad = gradientForId(l.userId);
            return (
              <Card key={l.userId} style={{ padding: 0, overflow: "hidden" }}>
                <div style={{ position: "relative", height: 120, background: `linear-gradient(150deg, ${grad[0]}, ${grad[1]})` }}>
                  <div className="em-grain" style={{ position: "absolute" }} />
                  {!unlocked && <div style={{ position: "absolute", inset: 0, backdropFilter: "blur(9px)", background: "rgba(0,0,0,.2)" }} />}
                </div>
                <div style={{ padding: 12 }}>
                  <div style={{ fontFamily: E.serif, fontSize: 15, filter: unlocked ? "none" : "blur(4px)" }}>{l.displayName}{l.age ? `, ${l.age}` : ""}</div>
                  <div style={{ fontSize: 11.5, color: E.textSub }}>{l.intent || ""}</div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
      {!unlocked && likes.length > 0 && (
        <Card style={{ maxWidth: 420, margin: "22px auto 0", textAlign: "center" }}>
          <div style={{ fontFamily: E.serif, fontSize: 17, marginBottom: 8 }}>{likes.length} people already liked you</div>
          <p style={{ color: E.textSub, fontSize: 13, marginBottom: 16 }}>Ember+ reveals who they are, instantly.</p>
          <Btn style={{ width: "100%" }} onClick={() => setTier("plus")}>Unlock with Ember+ — $19.99/mo</Btn>
        </Card>
      )}
    </Screen>
  );
}

// ─────────────────────────────────────────────────────────────
// FILTERS (Gold unlocks the advanced tier)
// ─────────────────────────────────────────────────────────────
function Filters({ setScreen, tier, setTier }) {
  const [distance, setDistance] = useState(15);
  const [ageMin, setAgeMin] = useState(24);
  const [ageMax, setAgeMax] = useState(38);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [prioritizePrompts, setPrioritizePrompts] = useState(true);
  const [hideExceptMutual, setHideExceptMutual] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const advancedUnlocked = tier === "gold" || tier === "black";

  useEffect(() => {
    let cancelled = false;
    api.getMyPreferences()
      .then(prefs => {
        if (cancelled || !prefs) return;
        setDistance(prefs.maxDistanceKm ?? 15);
        setAgeMin(prefs.ageMin ?? 24);
        setAgeMax(prefs.ageMax ?? 38);
        setVerifiedOnly(prefs.verifiedOnly ?? false);
      })
      .catch(err => { if (!cancelled) setError(err.message || "Couldn't load filters."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  async function save() {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      await api.upsertPreferences({
        maxDistanceKm: Number(distance),
        ageMin: Number(ageMin),
        ageMax: Number(ageMax),
        verifiedOnly,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err.message || "Couldn't save filters.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Screen title="Match filters" onBack={() => setScreen("matches")}>
        <div style={{ textAlign: "center", padding: 40 }}><Loader2 size={22} className="em-spin-icon" color={E.textSub} /></div>
      </Screen>
    );
  }

  return (
    <Screen title="Match filters" subtitle="Tune who shows up in your daily batch." onBack={() => setScreen("matches")}>
      <Card style={{ maxWidth: 480, margin: "0 auto" }}>
        <label style={fieldLabel}>Distance: {distance} km</label>
        <input type="range" min="1" max="500" value={distance} onChange={e => setDistance(e.target.value)} style={{ width: "100%", marginBottom: 18, background: "transparent", padding: 0 }} />

        <label style={fieldLabel}>Age range: {ageMin}–{ageMax}</label>
        <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
          <input type="range" min="18" max="60" value={ageMin} onChange={e => setAgeMin(Math.min(Number(e.target.value), ageMax))} style={{ flex: 1, background: "transparent", padding: 0 }} />
          <input type="range" min="18" max="60" value={ageMax} onChange={e => setAgeMax(Math.max(Number(e.target.value), ageMin))} style={{ flex: 1, background: "transparent", padding: 0 }} />
        </div>

        <button onClick={() => setVerifiedOnly(v => !v)} className="em-btn" style={{
          width: "100%", justifyContent: "space-between", padding: "12px 14px", borderRadius: 10,
          background: verifiedOnly ? E.accentB : E.surface, border: `1px solid ${verifiedOnly ? E.accent : E.border}`,
          color: E.text, marginBottom: 16,
        }}>
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ShieldCheck size={15} color={verifiedOnly ? E.accent : E.textSub} /> Verified members only
          </span>
          {verifiedOnly && <Check size={15} color={E.accent} />}
        </button>

        {error && <div style={{ color: E.rose, fontSize: 13, marginBottom: 14 }}>{error}</div>}
        <Btn style={{ width: "100%", marginBottom: 22 }} disabled={saving} onClick={save}>
          {saving ? <Loader2 size={16} className="em-spin-icon" /> : saved ? <><Check size={16} /> Saved</> : "Save filters"}
        </Btn>

        <div style={{ borderTop: `1px solid ${E.border}`, paddingTop: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Crown size={14} color={E.gold} />
            <span style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: ".05em", color: E.gold }}>ADVANCED — GOLD</span>
          </div>
          <div style={{ color: E.textDim, fontSize: 11, marginBottom: 10 }}>
            Demo only — not yet backed by real matching logic.
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, opacity: advancedUnlocked ? 1 : 0.4, pointerEvents: advancedUnlocked ? "auto" : "none" }}>
            <button onClick={() => setPrioritizePrompts(v => !v)} className="em-btn" style={{ width: "100%", justifyContent: "space-between", padding: "12px 14px", borderRadius: 10, background: E.surface, border: `1px solid ${E.border}`, color: E.text }}>
              <span>Prioritize shared-prompt compatibility</span>{prioritizePrompts && <Check size={15} color={E.accent} />}
            </button>
            <button onClick={() => setHideExceptMutual(v => !v)} className="em-btn" style={{ width: "100%", justifyContent: "space-between", padding: "12px 14px", borderRadius: 10, background: E.surface, border: `1px solid ${E.border}`, color: E.text }}>
              <span>Hide my profile except from mutual likes</span>{hideExceptMutual && <Check size={15} color={E.accent} />}
            </button>
          </div>
          {!advancedUnlocked && (
            <Btn variant="obsidian" style={{ width: "100%", marginTop: 14 }} onClick={() => setTier("gold")}>Unlock with Ember Gold — $39.99/mo</Btn>
          )}
        </div>
      </Card>
    </Screen>
  );
}

// ─────────────────────────────────────────────────────────────
// SAFETY
// ─────────────────────────────────────────────────────────────
function Safety({ setScreen }) {
  const [sharing, setSharing] = useState(false);
  const [duration, setDuration] = useState(4);
  const [contact, setContact] = useState("Priya (Mom)");
  const [checkedIn, setCheckedIn] = useState(false);
  const [panicOpen, setPanicOpen] = useState(false);

  return (
    <Screen title="Date safety" onBack={() => setScreen("chat")}>
      <div style={{ maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column", gap: 14 }}>
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, fontFamily: E.serif, fontWeight: 500, fontSize: 16 }}>
            <MapPin size={16} color={E.accent} /> Live location share
          </div>
          {!sharing ? (
            <>
              <label style={fieldLabel}>Trusted contact</label>
              <select value={contact} onChange={e => setContact(e.target.value)} style={{ width: "100%", marginBottom: 14 }}>
                <option>Priya (Mom)</option>
                <option>Sam (Best friend)</option>
                <option>Jordan (Roommate)</option>
              </select>
              <label style={fieldLabel}>Duration: {duration}h</label>
              <input type="range" min="1" max="8" value={duration} onChange={e => setDuration(e.target.value)} style={{ width: "100%", marginBottom: 16, background: "transparent", padding: 0 }} />
              <Btn style={{ width: "100%" }} onClick={() => setSharing(true)}>Start sharing</Btn>
            </>
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: E.accentB, border: `1px solid ${E.accent}`, borderRadius: 10, padding: "12px 14px" }}>
              <span style={{ fontSize: 13.5 }}>Sharing active with <b>{contact}</b> for {duration}h</span>
              <Btn variant="ghost" style={{ padding: "6px 10px", fontSize: 12 }} onClick={() => setSharing(false)}>Stop</Btn>
            </div>
          )}
        </Card>

        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, fontFamily: E.serif, fontWeight: 500, fontSize: 16 }}>
            <Eye size={16} color={E.accent} /> Post-date check-in
          </div>
          {checkedIn ? (
            <div style={{ color: E.green, fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>
              <Check size={16} /> You're marked safe.
            </div>
          ) : (
            <>
              <p style={{ color: E.textSub, fontSize: 13.5, marginBottom: 12 }}>We'll ask you to check in after your scheduled date time passes.</p>
              <Btn variant="ghost" style={{ width: "100%" }} onClick={() => setCheckedIn(true)}>Check in now</Btn>
            </>
          )}
        </Card>

        <Card style={{ borderColor: E.rose }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, fontFamily: E.serif, fontWeight: 500, fontSize: 16, color: E.rose }}>
            <AlertTriangle size={16} /> Emergency
          </div>
          <p style={{ color: E.textSub, fontSize: 13.5, marginBottom: 12 }}>Alerts your trusted contact and surfaces local emergency resources immediately.</p>
          <Btn variant="danger" style={{ width: "100%" }} onClick={() => setPanicOpen(true)}>Panic button</Btn>
        </Card>
      </div>

      {panicOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300, padding: 20 }}>
          <Card style={{ maxWidth: 380 }}>
            <div style={{ fontFamily: E.serif, fontWeight: 500, fontSize: 18, marginBottom: 10, color: E.rose }}>This would alert {contact} and surface local resources.</div>
            <p style={{ color: E.textSub, fontSize: 13, marginBottom: 16 }}>Prototype only — no real alert has been sent.</p>
            <Btn style={{ width: "100%" }} onClick={() => setPanicOpen(false)}>Close</Btn>
          </Card>
        </div>
      )}
    </Screen>
  );
}

// ─────────────────────────────────────────────────────────────
// SHARED SCREEN WRAPPER
// ─────────────────────────────────────────────────────────────
const fieldLabel = { display: "block", fontSize: 12.5, color: E.textSub, marginBottom: 6, fontWeight: 600 };

function Screen({ title, subtitle, onBack, children }) {
  return (
    <div className="em-fade" style={{ padding: "28px 6vw 160px", minHeight: "100vh" }}>
      <div style={{ maxWidth: 560, margin: "0 auto 22px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={onBack} className="em-btn" style={{ background: E.surface, border: `1px solid ${E.border}`, borderRadius: "50%", width: 36, height: 36, color: E.textSub }}>
            <ArrowLeft size={16} />
          </button>
          <h1 style={{ fontFamily: E.serif, fontWeight: 500, fontSize: 22, margin: 0 }}>{title}</h1>
        </div>
        {subtitle && <p style={{ color: E.textSub, fontSize: 13, margin: "8px 0 0 48px" }}>{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// APP
// ─────────────────────────────────────────────────────────────
export default function Ember() {
  const [screen, setScreen] = useState("landing");
  const [authUser, setAuthUser] = useState(null);
  const [bootLoading, setBootLoading] = useState(true);
  const [profile, setProfile] = useState({ name: "", email: "", dateOfBirth: "", intent: null, maxDistance: 15, photos: [false, false, false, false], answers: {}, verify: false });
  const [likedIds, setLikedIds] = useState([]);
  const [superLikedIds, setSuperLikedIds] = useState([]);
  const [activeMatch, setActiveMatch] = useState(null);
  const [tier, setTier] = useState("free");
  const [boostActive, setBoostActive] = useState(false);
  const [boostSeconds, setBoostSeconds] = useState(0);

  useEffect(() => { document.title = "Ember — Matched with intention"; }, []);

  // Restores a session from the persisted refresh token on load, so reloading the page
  // doesn't force a fresh login — a real (if minimal) session-continuity feature, not a
  // cosmetic loading spinner.
  useEffect(() => {
    let cancelled = false;
    api.restoreSession()
      .then(user => { if (!cancelled && user) { setAuthUser(user); setScreen("matches"); } })
      .catch(() => {})
      .finally(() => { if (!cancelled) setBootLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!boostActive) return;
    if (boostSeconds <= 0) { setBoostActive(false); return; }
    const t = setTimeout(() => setBoostSeconds(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [boostActive, boostSeconds]);

  function startBoost() { setBoostActive(true); setBoostSeconds(30); }

  async function handleLogout() {
    await api.logout();
    setAuthUser(null);
    setActiveMatch(null);
    setLikedIds([]);
    setSuperLikedIds([]);
    setScreen("landing");
  }

  if (bootLoading) {
    return (
      <div className="em-root" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <style>{CSS}</style>
        <Loader2 size={26} className="em-spin-icon" color={E.textSub} />
      </div>
    );
  }

  return (
    <div className="em-root">
      <style>{CSS}</style>
      <div className="em-grain" />
      <div style={{ position: "relative", zIndex: 1 }}>
        {screen === "landing" && <Landing setScreen={setScreen} setTier={setTier} authUser={authUser} />}
        {screen === "signup" && <Signup setScreen={setScreen} profile={profile} setProfile={setProfile} setAuthUser={setAuthUser} />}
        {screen === "login" && <Signup setScreen={setScreen} profile={profile} setProfile={setProfile} setAuthUser={setAuthUser} initialMode="login" />}
        {screen === "review" && <Review setScreen={setScreen} profile={profile} />}
        {screen === "profile" && <Profile setScreen={setScreen} profile={profile} setProfile={setProfile} />}
        {screen === "matches" && (
          <Matches
            setScreen={setScreen}
            likedIds={likedIds} setLikedIds={setLikedIds}
            superLikedIds={superLikedIds} setSuperLikedIds={setSuperLikedIds}
            setActiveMatch={setActiveMatch}
            tier={tier}
            boostActive={boostActive} boostSeconds={boostSeconds} startBoost={startBoost}
            viewerId={authUser?.id}
          />
        )}
        {screen === "likes" && <Likes setScreen={setScreen} tier={tier} setTier={setTier} />}
        {screen === "filters" && <Filters setScreen={setScreen} tier={tier} setTier={setTier} />}
        {screen === "chat" && (
          <Chat
            setScreen={setScreen}
            activeMatch={activeMatch}
            isPaid={tier !== "free"}
            viewerId={authUser?.id}
          />
        )}
        {screen === "safety" && <Safety setScreen={setScreen} />}
        <TierSwitcher screen={screen} tier={tier} setTier={setTier} />
        <PrototypeNav screen={screen} setScreen={setScreen} authUser={authUser} onLogout={handleLogout} />
      </div>
    </div>
  );
}
