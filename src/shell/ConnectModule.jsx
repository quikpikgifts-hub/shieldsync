import React from "react";
import { ExternalLink, Phone, TrendingUp } from "lucide-react";
import { T } from "./theme.js";
import { Btn, Card } from "./primitives.jsx";

// Veridian Connect (missed-call recovery / AI receptionist / revenue
// recovery) is a real, already-operating business with its own PIN-gated
// command center at /dashboard, built and secured independently of this
// shell (see ops/veridian-platform-audit.md, ops/veridian-sprint-0b-report.md).
// This module does not rebuild or duplicate that — it's an honest doorway
// into the real thing, consistent with "integrate, don't duplicate."
export default function ConnectModule() {
  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Veridian Connect</div>
      <div style={{ fontSize: 13, color: T.textSub, marginBottom: 20 }}>
        Missed-call recovery, AI receptionist, and lead follow-up automation — the platform's original product.
      </div>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <TrendingUp size={16} color={T.accent} />
          <div style={{ fontSize: 14, fontWeight: 700 }}>Command center</div>
        </div>
        <div style={{ fontSize: 12.5, color: T.textSub, lineHeight: 1.6, marginBottom: 14 }}>
          Leads, bookings, follow-up sequences, and priority scoring live in Connect's own dashboard —
          separately PIN-protected, unchanged by this restructure. Opening it here doesn't weaken that
          protection; you'll still enter the PIN there.
        </div>
        <Btn onClick={() => { window.location.href = "/dashboard"; }}>
          <ExternalLink size={14} /> Open Connect command center
        </Btn>
      </Card>

      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <Phone size={16} color={T.accent} />
          <div style={{ fontSize: 14, fontWeight: 700 }}>What's running underneath</div>
        </div>
        <div style={{ fontSize: 12.5, color: T.textSub, lineHeight: 1.8 }}>
          Twilio SMS text-back on missed calls · AI voice receptionist (Vapi) · revenue-recovery assessment
          funnel · GoHighLevel CRM sync · 4-stage email follow-up sequences. All live, all unaffected by
          Veridian Social's build-out — this shell only adds a doorway to them.
        </div>
      </Card>
    </div>
  );
}
