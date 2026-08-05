import React, { useState, useEffect } from "react";
import { LayoutDashboard, Sparkles, ExternalLink, Settings, LifeBuoy, LogOut, Plus, Bell, ChevronDown, User as UserIcon } from "lucide-react";
import { T, BASE_CSS, useInjectedStyle } from "./theme.js";
import { Btn, Card, Field, inputStyle, Pill } from "./primitives.jsx";
import { devAuth, workspaces, brands, pendingReviewCount } from "../social/store.js";
import { CreateBrand, BrandDetail, SocialConnectionsPanel } from "../social/shared.jsx";
import DashboardHome from "./DashboardHome.jsx";
import ConnectModule from "./ConnectModule.jsx";
import SupportModule from "./SupportModule.jsx";
import AIAssistantPanel from "./AIAssistantPanel.jsx";

// ─── Sign in (dev-mode — see src/social/store.js header comment) ──
function SignIn({ onSignedIn }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <Card style={{ width: 380 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <Sparkles size={20} color={T.accent} />
          <div style={{ fontSize: 18, fontWeight: 800 }}>Veridian AI</div>
        </div>
        <div style={{ fontSize: 13, color: T.textSub, marginBottom: 18 }}>
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
        <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Welcome to Veridian AI, {user.name}</div>
        <div style={{ fontSize: 13, color: T.textSub, marginBottom: 20 }}>Pick a workspace or create your first one.</div>
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

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "social", label: "Social", icon: Sparkles },
  { id: "connect", label: "Connect", icon: ExternalLink },
  { id: "settings", label: "Settings", icon: Settings },
  { id: "support", label: "Support", icon: LifeBuoy },
];

export default function Shell() {
  useInjectedStyle(BASE_CSS);
  const [user, setUser] = useState(() => devAuth.current());
  const [workspace, setWorkspace] = useState(null);
  const [brandList, setBrandList] = useState([]);
  const [activeBrand, setActiveBrand] = useState(null);
  const [creatingBrand, setCreatingBrand] = useState(false);
  const [nav, setNav] = useState("dashboard");
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const [allWorkspaces, setAllWorkspaces] = useState([]);

  useEffect(() => {
    if (workspace) {
      setBrandList(brands.list(workspace.id));
      if (user) setAllWorkspaces(workspaces.list().filter(w => w.ownerEmail === user.email));
    }
  }, [workspace, user]);

  if (!user) return <SignIn onSignedIn={setUser} />;
  if (!workspace) return <WorkspacePicker user={user} onEnter={setWorkspace} />;

  const goTo = (id) => { setNav(id); setActiveBrand(null); };
  const openBrand = (b) => { setNav("social"); setActiveBrand(b); };
  const totalPending = brandList.reduce((sum, b) => sum + pendingReviewCount(b.id), 0);

  const switchWorkspace = (ws) => {
    setWorkspace(ws);
    setActiveBrand(null);
    setNav("dashboard");
    setWorkspaceMenuOpen(false);
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar */}
      <div style={{ width: 220, borderRight: `1px solid ${T.border}`, padding: 20, display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
          <Sparkles size={18} color={T.accent} /><div style={{ fontWeight: 800, fontSize: 15 }}>Veridian AI</div>
        </div>
        {NAV.map(n => (
          <button key={n.id} onClick={() => goTo(n.id)} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
            background: nav === n.id ? T.accentB : "transparent", color: nav === n.id ? T.accent : T.textSub,
            border: "none", borderRadius: 8, padding: "9px 10px", fontSize: 13, fontWeight: 600,
            cursor: "pointer", marginBottom: 4, textAlign: "left",
          }}>
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}><n.icon size={15} /> {n.label}</span>
            {n.id === "social" && totalPending > 0 ? <Pill tone="amber">{totalPending}</Pill> : null}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 10.5, color: T.textDim, lineHeight: 1.5 }}>
          Veridian Connect (missed-call revenue recovery) keeps running independently of this shell.
        </div>
      </div>

      {/* Main column */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Topbar */}
        <div style={{ height: 60, borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* Workspace switcher */}
            <div style={{ position: "relative" }}>
              <button onClick={() => setWorkspaceMenuOpen(o => !o)} style={{
                display: "flex", alignItems: "center", gap: 6, background: T.surface, border: `1px solid ${T.border}`,
                borderRadius: 8, padding: "7px 10px", color: T.text, fontSize: 12.5, fontWeight: 600, cursor: "pointer",
              }}>
                {workspace.name} <ChevronDown size={13} />
              </button>
              {workspaceMenuOpen && (
                <div style={{ position: "absolute", top: "110%", left: 0, background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 6, minWidth: 200, zIndex: 40 }}>
                  {allWorkspaces.map(ws => (
                    <button key={ws.id} onClick={() => switchWorkspace(ws)} style={{
                      display: "block", width: "100%", textAlign: "left", background: ws.id === workspace.id ? T.accentB : "transparent",
                      color: T.text, border: "none", borderRadius: 6, padding: "7px 10px", fontSize: 12.5, cursor: "pointer", marginBottom: 2,
                    }}>{ws.name}</button>
                  ))}
                </div>
              )}
            </div>

            {/* Brand switcher — only meaningful once brands exist */}
            {brandList.length > 0 && (
              <select
                value={activeBrand?.id || ""}
                onChange={(e) => { const b = brandList.find(x => x.id === e.target.value); if (b) openBrand(b); }}
                style={{ ...inputStyle, width: "auto", padding: "7px 10px", fontSize: 12.5 }}
              >
                <option value="">Jump to brand…</option>
                {brandList.map(b => <option key={b.id} value={b.id}>{b.businessName}</option>)}
              </select>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={() => goTo("dashboard")} title="Notifications" style={{ position: "relative", background: "none", border: "none", cursor: "pointer", color: T.textSub }}>
              <Bell size={17} />
              {totalPending > 0 && (
                <span style={{ position: "absolute", top: -4, right: -6, background: T.amber, color: "#000", fontSize: 9, fontWeight: 800, borderRadius: 999, padding: "1px 5px" }}>{totalPending}</span>
              )}
            </button>
            <Btn variant="ghost" onClick={() => setAssistantOpen(o => !o)}><Sparkles size={14} /> Ask AI</Btn>

            {/* User menu */}
            <div style={{ position: "relative" }}>
              <button onClick={() => setUserMenuOpen(o => !o)} style={{
                display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: T.text,
              }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: T.accentB, color: T.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>
                  {user.name.slice(0, 1).toUpperCase()}
                </div>
                <ChevronDown size={13} color={T.textDim} />
              </button>
              {userMenuOpen && (
                <div style={{ position: "absolute", top: "110%", right: 0, background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 6, minWidth: 180, zIndex: 40 }}>
                  <div style={{ padding: "8px 10px", fontSize: 12, color: T.textDim, borderBottom: `1px solid ${T.border}`, marginBottom: 4 }}>{user.email}</div>
                  <button onClick={() => { devAuth.signOut(); setUser(null); setWorkspace(null); }} style={{
                    display: "flex", alignItems: "center", gap: 8, width: "100%", textAlign: "left", background: "none",
                    color: T.textSub, border: "none", borderRadius: 6, padding: "7px 10px", fontSize: 12.5, cursor: "pointer",
                  }}><LogOut size={13} /> Sign out</button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: 32, overflowY: "auto" }}>
          {nav === "dashboard" && (
            <DashboardHome
              user={user} workspace={workspace} brandList={brandList}
              onOpenBrand={openBrand}
              onAddBrand={() => { setNav("social"); setCreatingBrand(true); }}
              onGoToSocial={() => goTo("social")}
              onGoToConnect={() => goTo("connect")}
            />
          )}

          {nav === "social" && !activeBrand && (
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
                <div style={{ color: T.textDim, fontSize: 13, textAlign: "center", padding: 60 }}>No brands yet. Add your first brand to start generating content.</div>
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
                          <div style={{ fontSize: 12, color: T.textSub }}>{b.industry || "—"}</div>
                        </div>
                        <Btn variant="ghost" onClick={() => setActiveBrand(b)}>Open</Btn>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </>
          )}

          {nav === "social" && activeBrand && (
            <>
              <Btn variant="ghost" onClick={() => setActiveBrand(null)} style={{ marginBottom: 16 }}>← All brands</Btn>
              <BrandDetail brand={activeBrand} />
            </>
          )}

          {nav === "connect" && <ConnectModule />}

          {nav === "settings" && (
            <div style={{ maxWidth: 560 }}>
              <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>Settings</div>
              <SocialConnectionsPanel />
              <Card>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Billing</div>
                <div style={{ fontSize: 12.5, color: T.textSub, lineHeight: 1.6 }}>
                  Subscriptions require a live Stripe account and API keys. Not configured in this environment —
                  the workspace runs unmetered until billing is wired up.
                </div>
              </Card>
            </div>
          )}

          {nav === "support" && <SupportModule />}
        </div>
      </div>

      {assistantOpen && <AIAssistantPanel onClose={() => setAssistantOpen(false)} />}
    </div>
  );
}
