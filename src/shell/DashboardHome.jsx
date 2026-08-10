import React, { useEffect, useState } from "react";
import { Sparkles, Bell, Plus, ExternalLink, Zap, Users, Send, ListChecks } from "lucide-react";
import { T } from "./theme.js";
import { Btn, Card, Pill } from "./primitives.jsx";
import { contentItems, pendingReviewCount } from "../social/store.js";
import { attemptPublish, publishFallbackNote } from "../social/shared.jsx";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

// The founder's primary landing screen — an overview of everything Social,
// plus quick access into Connect. This is deliberately built from real data
// (pending review counts, live publisher connection status) rather than
// placeholder widgets.
export default function DashboardHome({ user, workspace, brandList, onOpenBrand, onAddBrand, onGoToSocial, onGoToConnect }) {
  const [publishers, setPublishers] = useState(null);
  const [dueItems, setDueItems] = useState([]);
  const [publishingId, setPublishingId] = useState(null);
  const [publishNotes, setPublishNotes] = useState({});

  const refreshDue = () => {
    const now = Date.now();
    setDueItems(
      brandList
        .flatMap(b => contentItems.list(b.id).filter(i => i.status === "scheduled" && new Date(i.scheduledFor).getTime() <= now).map(i => ({ ...i, brand: b })))
        .sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor))
    );
  };

  useEffect(() => {
    fetch("/api/social/publish").then(r => r.json()).then(d => setPublishers(d.publishers)).catch(() => setPublishers([]));
    refreshDue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandList]);

  const publishDueItem = async (item) => {
    setPublishingId(item.id);
    let note = "";
    if (item.platform && item.platform !== "general") {
      try {
        const result = await attemptPublish(item.platform, item);
        if (result.published) {
          contentItems.updateWithHistory(item.id, { status: "published", publishedAt: new Date().toISOString() });
          refreshDue();
          setPublishingId(null);
          return;
        }
        note = publishFallbackNote(item.platform, result.reason);
      } catch {
        note = "Publish check failed — copied for manual posting instead.";
      }
    }
    navigator.clipboard?.writeText(item.caption + (item.hashtags ? `\n\n${item.hashtags}` : ""));
    contentItems.updateWithHistory(item.id, { status: "published", publishedAt: new Date().toISOString() });
    setPublishNotes(n => ({ ...n, [item.id]: note || "Copied to clipboard for manual posting." }));
    refreshDue();
    setPublishingId(null);
  };

  const totalPending = brandList.reduce((sum, b) => sum + pendingReviewCount(b.id), 0);
  const connectedCount = (publishers || []).filter(p => p.state === "connected").length;

  const pendingItems = brandList
    .flatMap(b => contentItems.list(b.id).filter(i => i.status === "draft").map(i => ({ ...i, brand: b })))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>{greeting()}, {user.email.split("@")[0]}</div>
      <div style={{ fontSize: 13, color: T.textSub, marginBottom: 24 }}>Here's what's happening across {workspace.name}.</div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 12, marginBottom: 24 }}>
        <Card><div style={{ fontSize: 26, fontWeight: 800 }}>{brandList.length}</div><div style={{ fontSize: 11.5, color: T.textSub }}>Brands</div></Card>
        <Card><div style={{ fontSize: 26, fontWeight: 800, color: totalPending > 0 ? T.amber : T.text }}>{totalPending}</div><div style={{ fontSize: 11.5, color: T.textSub }}>Awaiting review</div></Card>
        <Card><div style={{ fontSize: 26, fontWeight: 800 }}>{connectedCount}/{publishers?.length ?? 7}</div><div style={{ fontSize: 11.5, color: T.textSub }}>Platforms connected</div></Card>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        <Btn onClick={onAddBrand}><Plus size={14} /> Add a brand</Btn>
        <Btn variant="ghost" onClick={onGoToSocial}><Sparkles size={14} /> Open Veridian Social</Btn>
        <Btn variant="ghost" onClick={onGoToConnect}><ExternalLink size={14} /> Open Veridian Connect</Btn>
      </div>

      <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
        <ListChecks size={16} color={T.accent} /> Today's Tasks
      </div>
      <div style={{ fontSize: 12, color: T.textDim, marginBottom: 16 }}>Everything that needs you, in one place.</div>

      {dueItems.length > 0 && (
        <>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
            <Send size={13} color={T.amber} /> Ready to publish ({dueItems.length})
          </div>
          {dueItems.map(item => (
            <Card key={item.id} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: publishNotes[item.id] ? 8 : 0 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 11.5, color: T.textDim, marginBottom: 4 }}>{item.brand.businessName}{item.platform && item.platform !== "general" ? ` · ${item.platform}` : ""} · scheduled {new Date(item.scheduledFor).toLocaleString()}</div>
                  <div style={{ fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.caption}</div>
                </div>
                <Btn onClick={() => publishDueItem(item)} disabled={publishingId === item.id} style={{ flexShrink: 0 }}>
                  <Send size={13} /> {publishingId === item.id ? "Publishing…" : "Publish now"}
                </Btn>
              </div>
              {publishNotes[item.id] && <div style={{ fontSize: 11.5, color: T.amber }}>{publishNotes[item.id]}</div>}
            </Card>
          ))}
        </>
      )}

      <div style={{ fontSize: 13, fontWeight: 700, margin: dueItems.length > 0 ? "20px 0 10px" : "0 0 10px", display: "flex", alignItems: "center", gap: 6 }}>
        <Bell size={13} color={T.amber} /> Pending your review
      </div>
      {pendingItems.length === 0 && (
        <Card style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, color: T.textDim }}>Nothing waiting on you right now. Generate new content from a brand to get started.</div>
        </Card>
      )}
      {pendingItems.map(item => (
        <Card key={item.id} style={{ marginBottom: 10, cursor: "pointer" }}>
          <div onClick={() => onOpenBrand(item.brand)} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11.5, color: T.textDim, marginBottom: 4 }}>{item.brand.businessName}{item.platform && item.platform !== "general" ? ` · ${item.platform}` : ""}</div>
              <div style={{ fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.caption}</div>
            </div>
            <Btn variant="ghost" onClick={() => onOpenBrand(item.brand)} style={{ flexShrink: 0 }}>Review</Btn>
          </div>
        </Card>
      ))}

      <div style={{ fontSize: 15, fontWeight: 700, margin: "24px 0 12px", display: "flex", alignItems: "center", gap: 6 }}>
        <Users size={15} color={T.accent} /> Brands
      </div>
      {brandList.length === 0 ? (
        <Card><div style={{ fontSize: 13, color: T.textDim, textAlign: "center", padding: 20 }}>No brands yet — add your first one to start generating content.</div></Card>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 12 }}>
          {brandList.map(b => {
            const p = pendingReviewCount(b.id);
            return (
              <Card key={b.id} style={{ cursor: "pointer" }}>
                <div onClick={() => onOpenBrand(b)}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{b.businessName}</div>
                  <div style={{ fontSize: 12, color: T.textSub, marginBottom: 8 }}>{b.industry || "—"}</div>
                  {p > 0 ? <Pill tone="amber">{p} pending</Pill> : <Pill tone="green">Up to date</Pill>}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
