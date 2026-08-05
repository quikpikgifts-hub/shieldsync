import React from "react";
import { T } from "./theme.js";

export const Btn = ({ children, onClick, variant = "primary", disabled, style, type = "button" }) => {
  const variants = {
    primary: { background: T.accent, color: "#fff", border: "none" },
    ghost: { background: "transparent", color: T.text, border: `1px solid ${T.border}` },
    danger: { background: T.redB, color: T.red, border: `1px solid ${T.red}33` },
    success: { background: T.greenB, color: T.green, border: `1px solid ${T.green}33` },
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

export const Card = ({ children, style }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20, ...style }}>{children}</div>
);

export const Field = ({ label, children }) => (
  <label style={{ display: "block", marginBottom: 14 }}>
    <div style={{ fontSize: 12, fontWeight: 600, color: T.textSub, marginBottom: 6 }}>{label}</div>
    {children}
  </label>
);

export const inputStyle = { width: "100%", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 12px", color: T.text, fontSize: 14, outline: "none" };

export const Pill = ({ children, tone = "textSub" }) => {
  const bg = { green: T.greenB, amber: T.amberB, red: T.redB, accent: T.accentB, textSub: "transparent" }[tone];
  const fg = { green: T.green, amber: T.amber, red: T.red, accent: T.accent, textSub: T.textSub }[tone];
  return <span style={{ background: bg, color: fg, fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 999, letterSpacing: ".02em" }}>{children}</span>;
};
