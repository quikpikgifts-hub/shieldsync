import React, { useState, useEffect, useRef } from "react";
import {
  Flame, Heart, X, ShieldCheck, MessageCircle, Mic, Video, MapPin,
  Sparkles, Lock, Check, ArrowRight, ArrowLeft, Camera, AlertTriangle,
  Users, Eye, Zap, Star,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────
const E = {
  bg: "#0F0A0C",
  surface: "#160F12",
  card: "#1C1418",
  cardH: "#241A1F",
  border: "#2E2126",
  borderH: "#4A2F35",
  accent: "#FF6B4A",
  accentH: "#FF8A5B",
  accentB: "rgba(255,107,74,0.10)",
  accentGlow: "rgba(255,107,74,0.28)",
  rose: "#F5455C",
  gold: "#F4B740",
  green: "#3DD68C",
  text: "#FBEFEA",
  textSub: "#B99089",
  textDim: "#5C4046",
};

const CSS = `
*{box-sizing:border-box}
.em-root{background:${E.bg};color:${E.text};font-family:-apple-system,BlinkMacSystemFont,'Inter','Segoe UI',sans-serif;min-height:100vh;-webkit-font-smoothing:antialiased}
.em-root ::-webkit-scrollbar{width:4px}
.em-root ::-webkit-scrollbar-thumb{background:${E.border};border-radius:2px}
.em-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;cursor:pointer;border:none;font-weight:600;transition:transform .15s ease,opacity .15s ease}
.em-btn:hover{transform:translateY(-1px);opacity:.92}
.em-btn:active{transform:translateY(0)}
.em-card{transition:transform .2s ease,border-color .2s ease}
.em-card:hover{transform:translateY(-3px);border-color:${E.borderH}}
.em-fade{animation:emFade .35s ease}
@keyframes emFade{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes emPulse{0%,100%{opacity:1}50%{opacity:.4}}
input,textarea{font-family:inherit;color:${E.text};background:${E.card};border:1px solid ${E.border};border-radius:10px;padding:12px 14px;outline:none}
input:focus,textarea:focus{border-color:${E.accent}}
input::placeholder,textarea::placeholder{color:${E.textDim}}
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

const MATCHES = [
  { id: 1, name: "Maya", age: 29, distance: "3 mi", compat: 92, tag: "Serious", answer: "Two truths and a lie: I've run a marathon, I hate cilantro, I once met a president." },
  { id: 2, name: "Jordan", age: 32, distance: "6 mi", compat: 87, tag: "Casual", answer: "My ideal Sunday is farmer's market, a long run, then cooking something new." },
  { id: 3, name: "Alex", age: 27, distance: "2 mi", compat: 81, tag: "Friendship-first", answer: "The way to my heart is a good playlist and zero small talk." },
];

const FEATURES = [
  {
    icon: ShieldCheck, title: "Identity & Trust", items: [
      "Photo verification with liveness check",
      "Optional ID verification badge",
      "One account per phone number",
      "Reports reviewed by a human within 24h",
    ],
  },
  {
    icon: Heart, title: "Matching", items: [
      "Intent tags required at signup",
      "Daily curated match batch, not endless scroll",
      "Compatibility score from shared prompts",
      "Distance & age-range preferences",
    ],
  },
  {
    icon: MessageCircle, title: "Conversation", items: [
      "Icebreaker prompts instead of “hey”",
      "Voice notes",
      "Video-call-to-meet before sharing contact info",
      "Read receipts as a paid feature",
    ],
  },
  {
    icon: MapPin, title: "Safety", items: [
      "Time-boxed live-location share on dates",
      "Post-date check-in prompts",
      "Panic / emergency contact button",
      "Optional self-initiated background check",
    ],
  },
];

const PRICING = [
  { name: "Free", price: "$0", note: "/mo", features: ["Limited daily matches", "Basic messaging", "Ads between screens"] },
  { name: "Ember+", price: "$19.99", note: "/mo", highlight: true, features: ["Unlimited matches", "See who liked you", "Read receipts", "No ads"] },
  { name: "Ember Gold", price: "$39.99", note: "/mo", features: ["Everything in +", "Priority placement", "Advanced filters", "Monthly human profile review"] },
];

const ALACARTE = [
  { label: "Boost", price: "$4.99" },
  { label: "Super Like (bundle)", price: "$1.99 ea" },
  { label: "ID verification badge", price: "$9.99 one-time" },
];

// ─────────────────────────────────────────────────────────────
// PRIMITIVES
// ─────────────────────────────────────────────────────────────
function Btn({ children, onClick, variant = "primary", style, disabled }) {
  const base = { padding: "13px 22px", borderRadius: 12, fontSize: 15 };
  const variants = {
    primary: { background: `linear-gradient(135deg, ${E.accent}, ${E.rose})`, color: "#1A0A08", boxShadow: `0 8px 24px ${E.accentGlow}` },
    ghost: { background: "transparent", color: E.text, border: `1px solid ${E.border}` },
    danger: { background: E.rose, color: "#fff" },
  };
  return (
    <button
      className="em-btn"
      disabled={disabled}
      onClick={onClick}
      style={{ ...base, ...variants[variant], opacity: disabled ? 0.4 : 1, cursor: disabled ? "not-allowed" : "pointer", ...style }}
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
  const initials = name.slice(0, 1).toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: gradient || `linear-gradient(135deg, ${E.accent}, ${E.rose})`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 700, fontSize: size * 0.4, color: "#1A0A08", flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

function PrototypeNav({ screen, setScreen }) {
  const steps = [
    ["signup", "Sign up"],
    ["profile", "Profile"],
    ["matches", "Matches"],
    ["chat", "Chat"],
    ["safety", "Safety"],
  ];
  if (screen === "landing") return null;
  return (
    <div style={{
      position: "fixed", bottom: 16, left: "50%", transform: "translateX(-50%)",
      display: "flex", gap: 6, background: "rgba(22,15,18,0.92)", backdropFilter: "blur(12px)",
      border: `1px solid ${E.border}`, borderRadius: 999, padding: 6, zIndex: 200, flexWrap: "wrap",
      justifyContent: "center", maxWidth: "94vw",
    }}>
      <button onClick={() => setScreen("landing")} className="em-btn" style={{
        padding: "8px 14px", borderRadius: 999, background: "transparent", color: E.textSub, fontSize: 12,
      }}>Landing</button>
      {steps.map(([id, label]) => (
        <button key={id} onClick={() => setScreen(id)} className="em-btn" style={{
          padding: "8px 14px", borderRadius: 999, fontSize: 12,
          background: screen === id ? E.accent : "transparent",
          color: screen === id ? "#1A0A08" : E.textSub,
        }}>{label}</button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// LANDING
// ─────────────────────────────────────────────────────────────
function Landing({ setScreen }) {
  return (
    <div className="em-fade">
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "22px 6vw" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700 }}>
          <Flame size={22} color={E.accent} /> Ember
        </div>
        <Btn onClick={() => setScreen("signup")}>Get Started</Btn>
      </nav>

      <section style={{ textAlign: "center", padding: "70px 6vw 60px", maxWidth: 780, margin: "0 auto" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 999,
          background: E.accentB, color: E.accent, fontSize: 13, fontWeight: 600, marginBottom: 22,
        }}>
          <Sparkles size={14} /> Matched with intention
        </div>
        <h1 style={{ fontSize: "clamp(34px,6vw,56px)", lineHeight: 1.1, margin: "0 0 18px", letterSpacing: "-0.02em" }}>
          Built for connection<br />that lasts longer than the chat.
        </h1>
        <p style={{ color: E.textSub, fontSize: 17, lineHeight: 1.6, marginBottom: 34 }}>
          A curated batch of real matches every day — not an endless swipe deck.
          Real intent, real safety, real conversation.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Btn onClick={() => setScreen("signup")}>Get Started <ArrowRight size={16} /></Btn>
          <Btn variant="ghost" onClick={() => setScreen("matches")}>See today's matches</Btn>
        </div>
      </section>

      <section style={{ padding: "20px 6vw 60px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px,1fr))", gap: 16 }}>
          {FEATURES.map(f => (
            <Card key={f.title}>
              <f.icon size={20} color={E.accent} style={{ marginBottom: 10 }} />
              <div style={{ fontWeight: 700, marginBottom: 10 }}>{f.title}</div>
              <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
                {f.items.map(i => (
                  <li key={i} style={{ color: E.textSub, fontSize: 13.5, display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <Check size={14} color={E.green} style={{ marginTop: 2, flexShrink: 0 }} />{i}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </section>

      <section style={{ padding: "20px 6vw 80px", maxWidth: 1100, margin: "0 auto" }}>
        <h2 style={{ textAlign: "center", fontSize: 26, marginBottom: 6 }}>Pick your tier</h2>
        <p style={{ textAlign: "center", color: E.textSub, marginBottom: 30 }}>Annual plans save 20%.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))", gap: 16 }}>
          {PRICING.map(t => (
            <Card key={t.name} style={t.highlight ? { border: `1px solid ${E.accent}`, boxShadow: `0 0 0 1px ${E.accent} inset` } : {}}>
              {t.highlight && (
                <div style={{ color: E.accent, fontSize: 11, fontWeight: 700, letterSpacing: ".05em", marginBottom: 8 }}>MOST POPULAR</div>
              )}
              <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>{t.name}</div>
              <div style={{ marginBottom: 14 }}>
                <span style={{ fontSize: 28, fontWeight: 700 }}>{t.price}</span>
                <span style={{ color: E.textSub, fontSize: 13 }}>{t.note}</span>
              </div>
              <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
                {t.features.map(f => (
                  <li key={f} style={{ color: E.textSub, fontSize: 13.5, display: "flex", gap: 8 }}>
                    <Check size={14} color={E.green} style={{ marginTop: 2, flexShrink: 0 }} />{f}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
        <div style={{ display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap", marginTop: 24, color: E.textSub, fontSize: 13.5 }}>
          {ALACARTE.map(a => <div key={a.label}><b style={{ color: E.text }}>{a.price}</b> {a.label}</div>)}
        </div>
      </section>

      <footer style={{ textAlign: "center", padding: "30px 6vw 50px", color: E.textDim, fontSize: 12.5, borderTop: `1px solid ${E.border}` }}>
        Ember is a product prototype. No real accounts, matches, or messages are stored.
      </footer>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SIGNUP
// ─────────────────────────────────────────────────────────────
function Signup({ setScreen, profile, setProfile }) {
  const [intent, setIntent] = useState(profile.intent);
  const [name, setName] = useState(profile.name);
  const [age, setAge] = useState(profile.age);
  const [maxDistance, setMaxDistance] = useState(profile.maxDistance);

  const canContinue = name.trim().length > 0 && intent;

  return (
    <Screen title="Tell us what you're looking for" onBack={() => setScreen("landing")}>
      <Card style={{ maxWidth: 520, margin: "0 auto" }}>
        <label style={fieldLabel}>Name</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" style={{ width: "100%", marginBottom: 18 }} />

        <label style={fieldLabel}>Age</label>
        <input type="number" value={age} onChange={e => setAge(e.target.value)} style={{ width: "100%", marginBottom: 18 }} />

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
        <input type="range" min="1" max="50" value={maxDistance} onChange={e => setMaxDistance(e.target.value)} style={{ width: "100%", marginBottom: 22, padding: 0, background: "transparent" }} />

        <Btn disabled={!canContinue} style={{ width: "100%" }} onClick={() => {
          setProfile(p => ({ ...p, name, age, intent, maxDistance }));
          setScreen("profile");
        }}>Continue <ArrowRight size={16} /></Btn>
      </Card>
    </Screen>
  );
}

// ─────────────────────────────────────────────────────────────
// PROFILE
// ─────────────────────────────────────────────────────────────
function Profile({ setScreen, profile, setProfile }) {
  const [photos, setPhotos] = useState(profile.photos || [false, false, false, false]);
  const [answers, setAnswers] = useState(profile.answers || {});
  const [verify, setVerify] = useState(profile.verify || false);

  return (
    <Screen title="Build your profile" onBack={() => setScreen("signup")}>
      <Card style={{ maxWidth: 560, margin: "0 auto" }}>
        <label style={fieldLabel}>Photos</label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 20 }}>
          {photos.map((added, i) => (
            <button key={i} onClick={() => setPhotos(p => p.map((v, idx) => idx === i ? !v : v))} className="em-btn" style={{
              aspectRatio: "1", borderRadius: 12, background: added ? E.accentB : E.surface,
              border: `1px dashed ${added ? E.accent : E.border}`, color: added ? E.accent : E.textDim,
            }}>
              {added ? <Check size={18} /> : <Camera size={18} />}
            </button>
          ))}
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
          color: E.text, marginBottom: 22,
        }}>
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ShieldCheck size={16} color={verify ? E.accent : E.textSub} />
            ID verification badge
          </span>
          <span style={{ color: E.gold, fontSize: 12.5, fontWeight: 700 }}>{verify ? "Added · $9.99" : "+$9.99"}</span>
        </button>

        <Btn style={{ width: "100%" }} onClick={() => {
          setProfile(p => ({ ...p, photos, answers, verify }));
          setScreen("matches");
        }}>See today's matches <ArrowRight size={16} /></Btn>
      </Card>
    </Screen>
  );
}

// ─────────────────────────────────────────────────────────────
// MATCHES
// ─────────────────────────────────────────────────────────────
function Matches({ setScreen, likedIds, setLikedIds, setActiveMatch }) {
  const remaining = Math.max(0, 3 - likedIds.length);
  const limitHit = likedIds.length >= 3;

  return (
    <Screen title="Today's curated matches" onBack={() => setScreen("profile")}>
      <div style={{ maxWidth: 520, margin: "0 auto", textAlign: "center", color: E.textSub, fontSize: 13.5, marginBottom: 18 }}>
        {limitHit
          ? "You've seen today's free batch — Ember+ unlocks unlimited matches."
          : `${remaining} of 3 daily matches remaining`}
      </div>
      <div style={{ maxWidth: 520, margin: "0 auto", display: "flex", flexDirection: "column", gap: 14 }}>
        {MATCHES.map(m => {
          const liked = likedIds.includes(m.id);
          return (
            <Card key={m.id}>
              <div style={{ display: "flex", gap: 14 }}>
                <Avatar name={m.name} size={56} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <div style={{ fontWeight: 700 }}>{m.name}, {m.age}</div>
                    <div style={{ color: E.textSub, fontSize: 12.5 }}>{m.distance}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", margin: "4px 0 8px" }}>
                    <span style={{ fontSize: 11, background: E.accentB, color: E.accent, padding: "2px 8px", borderRadius: 999, fontWeight: 600 }}>{m.tag}</span>
                    <span style={{ fontSize: 11, color: E.gold, display: "flex", alignItems: "center", gap: 3 }}><Star size={11} fill={E.gold} /> {m.compat}% match</span>
                  </div>
                  <div style={{ color: E.textSub, fontSize: 13, fontStyle: "italic" }}>"{m.answer}"</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                <Btn variant="ghost" style={{ flex: 1 }} disabled={liked} onClick={() => setLikedIds(ids => [...ids, m.id])}>
                  <X size={16} /> Pass
                </Btn>
                <Btn style={{ flex: 1 }} disabled={liked || limitHit} onClick={() => {
                  setLikedIds(ids => [...ids, m.id]);
                  setActiveMatch(m);
                  setScreen("chat");
                }}>
                  <Heart size={16} /> {liked ? "It's a match!" : "Like"}
                </Btn>
              </div>
            </Card>
          );
        })}
      </div>
    </Screen>
  );
}

// ─────────────────────────────────────────────────────────────
// CHAT
// ─────────────────────────────────────────────────────────────
function Chat({ setScreen, activeMatch, isPaid }) {
  const match = activeMatch || MATCHES[0];
  const [messages, setMessages] = useState([
    { from: "them", text: match.answer, icebreaker: true },
  ]);
  const [draft, setDraft] = useState("");
  const [recording, setRecording] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  function send() {
    if (!draft.trim()) return;
    setMessages(m => [...m, { from: "me", text: draft }]);
    setDraft("");
    setTimeout(() => {
      setMessages(m => [...m, { from: "them", text: "Ha, I like that — tell me more?" }]);
    }, 900);
  }

  function sendVoiceNote() {
    setRecording(true);
    setTimeout(() => {
      setRecording(false);
      setMessages(m => [...m, { from: "me", voice: true, text: "0:07" }]);
    }, 1200);
  }

  return (
    <Screen title={`Chat with ${match.name}`} onBack={() => setScreen("matches")}>
      <Card style={{ maxWidth: 560, margin: "0 auto", display: "flex", flexDirection: "column", height: 480, padding: 0, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 14, borderBottom: `1px solid ${E.border}` }}>
          <Avatar name={match.name} size={40} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{match.name}</div>
            <div style={{ fontSize: 11.5, color: E.textSub }}>{match.compat}% match</div>
          </div>
          <button className="em-btn" title="Share contact info unlocks after a video call" style={{
            background: E.surface, border: `1px solid ${E.border}`, color: E.textSub, padding: "8px 12px", borderRadius: 999, fontSize: 12,
          }}>
            <Video size={14} /> Video-call to meet
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
          {messages.map((m, i) => (
            <div key={i} style={{ alignSelf: m.from === "me" ? "flex-end" : "flex-start", maxWidth: "80%" }}>
              {m.icebreaker && (
                <div style={{ fontSize: 10.5, color: E.accent, marginBottom: 4, display: "flex", alignItems: "center", gap: 4 }}>
                  <Sparkles size={11} /> ICEBREAKER PROMPT
                </div>
              )}
              <div style={{
                background: m.from === "me" ? `linear-gradient(135deg, ${E.accent}, ${E.rose})` : E.surface,
                color: m.from === "me" ? "#1A0A08" : E.text,
                padding: "10px 14px", borderRadius: 14, fontSize: 14,
                display: "flex", alignItems: "center", gap: 6,
              }}>
                {m.voice ? <><Mic size={14} /> Voice note · {m.text}</> : m.text}
              </div>
              {m.from === "me" && (
                <div style={{ fontSize: 10.5, color: E.textDim, marginTop: 3, display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end" }}>
                  {isPaid ? <>Seen</> : <><Lock size={9} /> Seen — Ember+ only</>}
                </div>
              )}
            </div>
          ))}
          <div ref={endRef} />
        </div>

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
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, fontWeight: 700 }}>
            <MapPin size={16} color={E.accent} /> Live location share
          </div>
          {!sharing ? (
            <>
              <label style={fieldLabel}>Trusted contact</label>
              <select value={contact} onChange={e => setContact(e.target.value)} style={{ width: "100%", marginBottom: 14, background: E.card, color: E.text, border: `1px solid ${E.border}`, borderRadius: 10, padding: "12px 14px" }}>
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
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, fontWeight: 700 }}>
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
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, fontWeight: 700, color: E.rose }}>
            <AlertTriangle size={16} /> Emergency
          </div>
          <p style={{ color: E.textSub, fontSize: 13.5, marginBottom: 12 }}>Alerts your trusted contact and surfaces local emergency resources immediately.</p>
          <Btn variant="danger" style={{ width: "100%" }} onClick={() => setPanicOpen(true)}>Panic button</Btn>
        </Card>
      </div>

      {panicOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300, padding: 20 }}>
          <Card style={{ maxWidth: 380 }}>
            <div style={{ fontWeight: 700, marginBottom: 10, color: E.rose }}>This would alert {contact} and surface local resources.</div>
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

function Screen({ title, onBack, children }) {
  return (
    <div className="em-fade" style={{ padding: "28px 6vw 100px", minHeight: "100vh" }}>
      <div style={{ maxWidth: 560, margin: "0 auto 22px", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onBack} className="em-btn" style={{ background: E.surface, border: `1px solid ${E.border}`, borderRadius: "50%", width: 36, height: 36, color: E.textSub }}>
          <ArrowLeft size={16} />
        </button>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{title}</h1>
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
  const [profile, setProfile] = useState({ name: "", age: 28, intent: null, maxDistance: 15, photos: [false, false, false, false], answers: {}, verify: false });
  const [likedIds, setLikedIds] = useState([]);
  const [activeMatch, setActiveMatch] = useState(null);

  useEffect(() => { document.title = "Ember — Matched with intention"; }, []);

  return (
    <div className="em-root">
      <style>{CSS}</style>
      {screen === "landing" && <Landing setScreen={setScreen} />}
      {screen === "signup" && <Signup setScreen={setScreen} profile={profile} setProfile={setProfile} />}
      {screen === "profile" && <Profile setScreen={setScreen} profile={profile} setProfile={setProfile} />}
      {screen === "matches" && <Matches setScreen={setScreen} likedIds={likedIds} setLikedIds={setLikedIds} setActiveMatch={setActiveMatch} />}
      {screen === "chat" && <Chat setScreen={setScreen} activeMatch={activeMatch} isPaid={profile.verify} />}
      {screen === "safety" && <Safety setScreen={setScreen} />}
      <PrototypeNav screen={screen} setScreen={setScreen} />
    </div>
  );
}
