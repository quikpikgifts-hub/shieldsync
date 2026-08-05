import React, { useState, useRef, useEffect } from "react";
import { X, Sparkles, Send } from "lucide-react";
import { T } from "./theme.js";
import { Btn, inputStyle } from "./primitives.jsx";
import { safeJson } from "../social/shared.jsx";

const SYSTEM_PROMPT =
  "You are the Veridian AI platform assistant. You help the founder navigate and use Veridian AI " +
  "(Veridian Social for AI-generated brand content, and Veridian Connect for missed-call revenue " +
  "recovery). Be concise — 2-4 sentences unless asked for more. If asked to do something the platform " +
  "can't do yet (e.g. auto-publish to a platform that isn't connected), say so plainly rather than " +
  "implying it already works.";

// Reuses the existing general-purpose /api/ai proxy (already required
// infra — same ANTHROPIC_API_KEY as Social's content generation) rather
// than building a new endpoint for what is, functionally, the same kind of
// call with a different system prompt.
export default function AIAssistantPanel({ onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    const next = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.slice(-10), system: SYSTEM_PROMPT, max_tokens: 500 }),
      });
      const data = await safeJson(r);
      if (!data) throw new Error("Assistant didn't respond — is the API layer running?");
      if (!r.ok) throw new Error(data.error || "Assistant request failed");
      setMessages(m => [...m, { role: "assistant", content: data.text }]);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{
      position: "fixed", top: 0, right: 0, bottom: 0, width: 360, background: T.card,
      borderLeft: `1px solid ${T.border}`, display: "flex", flexDirection: "column", zIndex: 50,
      boxShadow: "-8px 0 24px rgba(0,0,0,0.3)",
    }}>
      <div style={{ padding: 16, borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 14 }}>
          <Sparkles size={16} color={T.accent} /> Ask Veridian AI
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", color: T.textDim, cursor: "pointer" }}><X size={18} /></button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
        {messages.length === 0 && (
          <div style={{ fontSize: 12.5, color: T.textDim, lineHeight: 1.6 }}>
            Ask about your brands, content, or how something in the platform works.
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} style={{
            marginBottom: 12, fontSize: 13, lineHeight: 1.5,
            background: m.role === "user" ? T.accentB : T.surface,
            padding: "8px 12px", borderRadius: 10,
            marginLeft: m.role === "user" ? 24 : 0, marginRight: m.role === "user" ? 0 : 24,
          }}>
            {m.content}
          </div>
        ))}
        {error && <div style={{ color: T.red, fontSize: 12, marginBottom: 10 }}>{error}</div>}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={send} style={{ padding: 16, borderTop: `1px solid ${T.border}`, display: "flex", gap: 8 }}>
        <input style={inputStyle} value={input} onChange={e => setInput(e.target.value)} placeholder="Ask anything…" disabled={busy} />
        <Btn type="submit" disabled={busy || !input.trim()}><Send size={14} /></Btn>
      </form>
    </div>
  );
}
