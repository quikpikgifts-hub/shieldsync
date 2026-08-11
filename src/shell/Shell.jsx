import React, { useState, useEffect } from "react";
import { LayoutDashboard, Sparkles, ExternalLink, Settings, LifeBuoy, LogOut, Plus, Bell, ChevronDown, User as UserIcon } from "lucide-react";
import { T, BASE_CSS, useInjectedStyle, useOnlineStatus } from "./theme.js";
import { Btn, Card, Field, inputStyle, Pill } from "./primitives.jsx";
import { workspaces, brands, pendingReviewCount, lastWorkspace } from "../social/store.js";
import * as auth from "../lib/auth.js";
import { CreateBrand, BrandDetail, SocialConnectionsPanel } from "../social/shared.jsx";
import DashboardHome from "./DashboardHome.jsx";
import ConnectModule from "./ConnectModule.jsx";
import SupportModule from "./SupportModule.jsx";
import AIAssistantPanel from "./AIAssistantPanel.jsx";

// ─── Sign in — real Supabase Auth via /api/auth/* (src/lib/auth.js) ──
function SignIn({ onSignedIn }) {
  const [mode, setMode] = useState("signin"); // "signin" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [confirmSent, setConfirmSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "signup") {
        const result = await auth.signUp(email.trim(), password);
        if (result.needsEmailConfirmation) {
          setConfirmSent(true);
        } else {
          onSignedIn(result);
        }
      } else {
        onSignedIn(await auth.signInWithPassword(email.trim(), password));
      }
    } catch (err) {
      setError(err.message || "Something went wrong — please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (confirmSent) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <Card style={{ width: 380, textAlign: "center" }}>
          <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Check your email</div>
          <div style={{ fontSize: 13, color: T.textSub, lineHeight: 1.6 }}>
            We sent a confirmation link to <strong>{email}</strong>. Click it, then come back and sign in.
          </div>
          <Btn variant="ghost" style={{ marginTop: 16 }} onClick={() => { setConfirmSent(false); setMode("signin"); }}>Back to sign in</Btn>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <Card style={{ width: 380 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <Sparkles size={20} color={T.accent} />
          <div style={{ fontSize: 18, fontWeight: 800 }}>Veridian AI</div>
        </div>
        <div style={{ fontSize: 13, color: T.textSub, marginBottom: 18 }}>
          {mode === "signup" ? "Create your account." : "Sign in to your account."}
        </div>
        {error && (
          <div style={{ background: T.redB, border: `1px solid ${T.red}44`, color: T.red, borderRadius: 8, padding: "8px 10px", fontSize: 12.5, marginBottom: 14 }}>
            {error}
          </div>
        )}
        <form onSubmit={submit}>
          <Field label="Email"><input style={inputStyle} value={email} onChange={e => setEmail(e.target.value)} type="email" required placeholder="you@yourbusiness.com" autoComplete="email" /></Field>
          <Field label="Password">
            <input
              style={inputStyle} value={password} onChange={e => setPassword(e.target.value)}
              type="password" required minLength={mode === "signup" ? 8 : undefined}
              placeholder={mode === "signup" ? "At least 8 characters" : "Your password"}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
            />
          </Field>
          <Btn type="submit" disabled={busy} style={{ width: "100%", justifyContent: "center", marginTop: 4 }}>
            {busy ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
          </Btn>
        </form>
        <div style={{ marginTop: 14, textAlign: "center", fontSize: 12.5, color: T.textSub }}>
          {mode === "signup" ? "Already have an account?" : "New here?"}{" "}
          <button
            onClick={() => { setMode(mode === "signup" ? "signin" : "signup"); setError(null); }}
            style={{ background: "none", border: "none", color: T.accent, cursor: "pointer", fontWeight: 700, fontSize: 12.5 }}
          >
            {mode === "signup" ? "Sign in" : "Create one"}
          </button>
        </div>
      </Card>
    </div>
  );
}

// ─── Workspace sync ─────────────────────────────────────────────
// One local workspace record per real organization (Founder Alpha is
// single-org by design — see api/auth/session.js's bootstrap). Syncs on
// every sign-in rather than assuming a 1-time setup, and backfills any
// pre-Sprint-1 local workspace that only has the old `ownerEmail` field so
// existing dev-mode brand data isn't orphaned by the identity switch.
function syncWorkspacesForOrgs(user, organizations) {
  const all = workspaces.list();
  return organizations.map((org) => {
    const existingByOrg = all.find((w) => w.ownerOrgId === org.id);
    if (existingByOrg) return existingByOrg;
    const legacyByEmail = all.find((w) => !w.ownerOrgId && w.ownerEmail === user.email);
    if (legacyByEmail) return workspaces.update(legacyByEmail.id, { ownerOrgId: org.id, name: legacyByEmail.name || org.name });
    return workspaces.insert({ name: org.name, ownerEmail: user.email, ownerOrgId: org.id });
  });
}

// Platforms with a real OAuth callback redirect (api/social/oauth/{p}/callback.js)
// whose result the shell should surface as a banner on return to /app.
const OAUTH_REDIRECT_PLATFORMS = ["tiktok", "x", "linkedin", "youtube", "pinterest"];

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "social", label: "Social", icon: Sparkles },
  { id: "connect", label: "Connect", icon: ExternalLink },
  { id: "settings", label: "Settings", icon: Settings },
  { id: "support", label: "Support", icon: LifeBuoy },
];

export default function Shell() {
  useInjectedStyle(BASE_CSS);
  const online = useOnlineStatus();
  // undefined = still resolving an existing session; null = signed out.
  const [session, setSession] = useState(undefined);
  const [orgError, setOrgError] = useState(null);
  const [workspace, setWorkspace] = useState(null);
  const [brandList, setBrandList] = useState([]);
  const [activeBrand, setActiveBrand] = useState(null);
  const [creatingBrand, setCreatingBrand] = useState(false);
  const [nav, setNav] = useState("dashboard");
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const [allWorkspaces, setAllWorkspaces] = useState([]);
  const [oauthNotice, setOauthNotice] = useState(null);

  const user = session?.user || null;

  // Resolves (and silently refreshes, if needed) any existing session once
  // on mount, so a page reload doesn't force a re-sign-in every time.
  useEffect(() => {
    let cancelled = false;
    auth.getValidSession().then((s) => { if (!cancelled) setSession(s); });
    return () => { cancelled = true; };
  }, []);

  // Once signed in, fetch (and, on a brand-new account, trigger server-side
  // provisioning of) real organizations, then sync them into the local
  // workspace records that brands/content are still scoped to.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setOrgError(null);
    auth.fetchOrganizations(session.access_token)
      .then(({ organizations, warning }) => {
        if (cancelled) return;
        if (warning) setOrgError(warning);
        setAllWorkspaces(syncWorkspacesForOrgs(user, organizations));
      })
      .catch((err) => { if (!cancelled) setOrgError(err.message); });
    return () => { cancelled = true; };
  }, [user, session?.access_token]);

  useEffect(() => {
    if (workspace) {
      setBrandList(brands.list(workspace.id));
      lastWorkspace.set(workspace.id);
    }
  }, [workspace]);

  // Auto-enters the single workspace most sign-ins will have (Founder Alpha
  // is single-org by design), or restores the last-used one on reload;
  // only falls through to a picker when there's genuinely more than one.
  useEffect(() => {
    if (!user || workspace || allWorkspaces.length === 0) return;
    if (allWorkspaces.length === 1) {
      setWorkspace(allWorkspaces[0]);
      return;
    }
    const savedId = lastWorkspace.get();
    const found = savedId && allWorkspaces.find((w) => w.id === savedId);
    if (found) setWorkspace(found);
  }, [user, workspace, allWorkspaces]);

  // Handles the redirect back from /api/social/oauth/{platform}/callback so
  // the founder gets a clear "connected" or "failed" result, not a silent
  // return — generic across every platform with a real OAuth flow, not
  // hardcoded to whichever one shipped first (TikTok).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const platform = OAUTH_REDIRECT_PLATFORMS.find((p) => params.get(p));
    if (platform) {
      const result = params.get(platform);
      const label = platform[0].toUpperCase() + platform.slice(1);
      setOauthNotice(
        result === "connected"
          ? { tone: "green", text: `${label} account connected — you can publish directly now.` }
          : { tone: "red", text: `${label} connection failed. Check its credentials in Settings and try again.` }
      );
      window.history.replaceState({}, "", "/app");
    }
  }, []);

  if (session === undefined) return null; // resolving an existing session — avoid a sign-in flash
  if (!user) return <SignIn onSignedIn={setSession} />;

  if (!workspace) {
    if (orgError && allWorkspaces.length === 0) {
      return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <Card style={{ width: 420, textAlign: "center" }}>
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>Couldn't load your workspace</div>
            <div style={{ fontSize: 13, color: T.textSub, lineHeight: 1.6, marginBottom: 16 }}>{orgError}</div>
            <Btn variant="ghost" onClick={() => { auth.signOut(); setSession(null); }}><LogOut size={13} /> Sign out</Btn>
          </Card>
        </div>
      );
    }
    if (allWorkspaces.length > 1) {
      return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ width: 420 }}>
            <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Choose a workspace</div>
            <div style={{ fontSize: 13, color: T.textSub, marginBottom: 20 }}>{user.email}</div>
            {allWorkspaces.map((ws) => (
              <Card key={ws.id} style={{ marginBottom: 10, cursor: "pointer" }}>
                <div onClick={() => setWorkspace(ws)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontWeight: 700 }}>{ws.name}</div>
                  <Btn variant="ghost" onClick={() => setWorkspace(ws)}>Open</Btn>
                </div>
              </Card>
            ))}
          </div>
        </div>
      );
    }
    return null; // exactly one workspace — the auto-enter effect above is resolving it
  }

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
                  {user.email.slice(0, 1).toUpperCase()}
                </div>
                <ChevronDown size={13} color={T.textDim} />
              </button>
              {userMenuOpen && (
                <div style={{ position: "absolute", top: "110%", right: 0, background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 6, minWidth: 180, zIndex: 40 }}>
                  <div style={{ padding: "8px 10px", fontSize: 12, color: T.textDim, borderBottom: `1px solid ${T.border}`, marginBottom: 4 }}>{user.email}</div>
                  <button onClick={() => { auth.signOut(); setSession(null); setWorkspace(null); setAllWorkspaces([]); }} style={{
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
          {!online && (
            <div style={{ background: T.amberB, border: `1px solid ${T.amber}44`, color: T.amber, borderRadius: 10, padding: "10px 14px", fontSize: 12.5, marginBottom: 20 }}>
              You're offline. Your brands and drafts are still here — AI generation and publishing will resume once you're back online.
            </div>
          )}
          {oauthNotice && (
            <div style={{
              background: oauthNotice.tone === "green" ? T.greenB : T.redB,
              border: `1px solid ${(oauthNotice.tone === "green" ? T.green : T.red)}44`,
              color: oauthNotice.tone === "green" ? T.green : T.red,
              borderRadius: 10, padding: "10px 14px", fontSize: 12.5, marginBottom: 20,
              display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12,
            }}>
              {oauthNotice.text}
              <button onClick={() => setOauthNotice(null)} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>Dismiss</button>
            </div>
          )}
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
              <BrandDetail key={activeBrand.id} brand={activeBrand} />
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
