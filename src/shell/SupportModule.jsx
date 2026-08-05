import React from "react";
import { Mail, Phone } from "lucide-react";
import { T } from "./theme.js";
import { Card } from "./primitives.jsx";

export default function SupportModule() {
  return (
    <div style={{ maxWidth: 480 }}>
      <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Support</div>
      <div style={{ fontSize: 13, color: T.textSub, marginBottom: 20 }}>Founder-led support during the pilot — no ticketing system yet, direct contact.</div>
      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <Phone size={15} color={T.accent} />
          <a href="tel:+14074705992" style={{ color: T.text, textDecoration: "none", fontSize: 14, fontWeight: 600 }}>(407) 470-5992</a>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Mail size={15} color={T.accent} />
          <a href="mailto:info@veridianriskgroup.org" style={{ color: T.text, textDecoration: "none", fontSize: 14, fontWeight: 600 }}>info@veridianriskgroup.org</a>
        </div>
      </Card>
    </div>
  );
}
