import React from "react";
import {
  ArrowUpRight, BookOpen, CircleDollarSign, Clapperboard, ExternalLink,
  Link2, Radio, ShieldCheck, ShoppingBag, Workflow
} from "lucide-react";
import { T } from "./theme.js";

const DESTINATIONS = [
  {
    title: "Quik Pik Storefront",
    description: "Digital products, guides, and the Ember coloring book.",
    href: "https://quikpik.gumroad.com/",
    label: "Open storefront",
    icon: ShoppingBag,
    tone: "green",
    status: "Live link",
  },
  {
    title: "Quik Pik Link Hub",
    description: "The central Quik Pik destination page.",
    href: "https://beacons.ai/gspeed/quikpik",
    label: "Open link hub",
    icon: Link2,
    tone: "blue",
    status: "Live link",
  },
  {
    title: "Drama Hub",
    description: "Review the current drama prototype and production experience.",
    href: "https://incomparable-marshmallow-b3d5c4.netlify.app/",
    label: "Open prototype",
    icon: Clapperboard,
    tone: "purple",
    status: "Prototype",
  },
  {
    title: "ShieldSync",
    description: "The Veridian operational platform this hub lives inside.",
    href: "https://shieldsync-jbsx.vercel.app/",
    label: "Open platform",
    icon: ShieldCheck,
    tone: "blue",
    status: "Current platform",
  },
];

const LANES = [
  {
    title: "Revenue & conversion",
    detail: "Prioritize storefront visits, product-page conversion, and the first verified sale.",
    icon: CircleDollarSign,
    status: "Priority 1",
    tone: "amber",
  },
  {
    title: "Publishing & production",
    detail: "Track Kids Hub, Cat Moves, Drama Hub, and book assets without publishing automatically.",
    icon: BookOpen,
    status: "Owner approval required",
    tone: "purple",
  },
  {
    title: "Audience growth",
    detail: "Connect content experiments to measurable profile visits, link taps, and product traffic.",
    icon: Radio,
    status: "Measurement needed",
    tone: "blue",
  },
];

const toneMap = {
  green: { bg: "rgba(16,185,129,.10)", fg: "#10B981", border: "rgba(16,185,129,.28)" },
  blue: { bg: "rgba(99,102,241,.10)", fg: "#818CF8", border: "rgba(99,102,241,.28)" },
  purple: { bg: "rgba(168,85,247,.10)", fg: "#C084FC", border: "rgba(168,85,247,.28)" },
  amber: { bg: "rgba(245,158,11,.10)", fg: "#F59E0B", border: "rgba(245,158,11,.28)" },
};

function Status({ children, tone = "blue" }) {
  const c = toneMap[tone] || toneMap.blue;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", border: `1px solid ${c.border}`,
      borderRadius: 999, padding: "4px 8px", fontSize: 10.5, fontWeight: 700,
      color: c.fg, background: c.bg, whiteSpace: "nowrap",
    }}>{children}</span>
  );
}

function Panel({ children, style = {} }) {
  return (
    <section style={{
      background: T.card, border: `1px solid ${T.border}`, borderRadius: 14,
      padding: 18, minWidth: 0, ...style,
    }}>{children}</section>
  );
}

export default function QuikPikModule() {
  return (
    <div style={{ maxWidth: 1120, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap", marginBottom: 22 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".14em", color: T.accent, marginBottom: 8 }}>QUIK PIK OPERATIONS</div>
          <h1 style={{ fontSize: 27, lineHeight: 1.2, margin: 0, color: T.text }}>Quik Pik × ShieldSync</h1>
          <p style={{ color: T.textSub, fontSize: 13.5, lineHeight: 1.7, maxWidth: 680, marginTop: 10 }}>
            One operations hub for Quik Pik’s storefront, content lanes, and production destinations.
            This first integration connects the verified destinations and operating priorities; it does not yet import live sales or social analytics.
          </p>
        </div>
        <Status tone="green">Hub connected in ShieldSync</Status>
      </div>

      <Panel style={{ marginBottom: 20, borderColor: "rgba(99,102,241,.35)", background: "linear-gradient(135deg, rgba(99,102,241,.10), rgba(10,10,30,.92))" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <Workflow size={20} color={T.accent} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ color: T.text, fontSize: 14, fontWeight: 800, marginBottom: 5 }}>Integration boundary</div>
            <div style={{ color: T.textSub, fontSize: 12.5, lineHeight: 1.7 }}>
              Links and operational tracking are available here. Automated Gumroad sales ingestion, social-platform metrics, CRM synchronization, and publishing actions remain disconnected until their supported APIs and credentials are verified. No credentials are stored in this UI.
            </div>
          </div>
        </div>
      </Panel>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 12, marginBottom: 24 }}>
        {DESTINATIONS.map((item) => {
          const Icon = item.icon;
          return (
            <Panel key={item.title} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, display: "grid", placeItems: "center", background: (toneMap[item.tone] || toneMap.blue).bg, color: (toneMap[item.tone] || toneMap.blue).fg }}>
                  <Icon size={19} />
                </div>
                <Status tone={item.tone}>{item.status}</Status>
              </div>
              <div>
                <div style={{ color: T.text, fontWeight: 800, fontSize: 14, marginBottom: 6 }}>{item.title}</div>
                <div style={{ color: T.textSub, fontSize: 12.5, lineHeight: 1.65 }}>{item.description}</div>
              </div>
              <a href={item.href} target="_blank" rel="noreferrer" style={{
                display: "inline-flex", alignItems: "center", gap: 7, marginTop: "auto",
                color: T.accent, textDecoration: "none", fontSize: 12.5, fontWeight: 800,
              }}>{item.label} <ArrowUpRight size={14} /></a>
            </Panel>
          );
        })}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
        <h2 style={{ color: T.text, fontSize: 17, margin: 0 }}>Operating lanes</h2>
        <span style={{ color: T.textSub, fontSize: 11.5 }}>Prepared for centralized tracking</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 12 }}>
        {LANES.map((lane) => {
          const Icon = lane.icon;
          return (
            <Panel key={lane.title}>
              <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12 }}>
                <Icon size={17} color={(toneMap[lane.tone] || toneMap.blue).fg} />
                <div style={{ color: T.text, fontSize: 13.5, fontWeight: 800 }}>{lane.title}</div>
              </div>
              <p style={{ color: T.textSub, fontSize: 12.5, lineHeight: 1.7, margin: "0 0 14px" }}>{lane.detail}</p>
              <Status tone={lane.tone}>{lane.status}</Status>
            </Panel>
          );
        })}
      </div>

      <div style={{ marginTop: 20, color: T.textSub, fontSize: 11.5, lineHeight: 1.7 }}>
        Next technical phase: authenticated event intake for leads and sales, source-specific deduplication, and a read-only metrics view. Keep publishing, outbound messages, billing changes, and production deployment behind explicit approval.
      </div>
    </div>
  );
}
