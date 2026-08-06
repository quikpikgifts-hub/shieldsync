import React, { Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";

// Lazy-loaded so each route's JS chunk (and only that chunk) reaches the browser.
// The public Connect site (Website.jsx) and its own /dashboard command center
// are untouched by this shell and must keep working exactly as before — that's
// the live, revenue-generating business. /app and /social both open the new
// unified Veridian AI shell (Social is its default landing view); there is
// no separate standalone Social page anymore — one shell, not two surfaces.
const Website = lazy(() => import("./Website.jsx"));
const Shell = lazy(() => import("./shell/Shell.jsx"));

// Without this, an unhandled render error anywhere in the tree unmounts to a
// blank white page with no feedback and no recovery path — the founder would
// have no idea what happened or that a reload fixes it.
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error("[Veridian AI] Unhandled render error:", error, info?.componentStack);
  }
  render() {
    if (this.state.error) {
      return React.createElement(
        "div",
        { style: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, padding: 24, textAlign: "center", background: "#0A0A12", color: "#F1F0FA", fontFamily: "-apple-system,BlinkMacSystemFont,'Inter','Segoe UI',sans-serif" } },
        React.createElement("div", { style: { fontSize: 18, fontWeight: 800 } }, "Something went wrong"),
        React.createElement("div", { style: { fontSize: 13.5, color: "#8B8AA8", maxWidth: 420 } }, "Veridian AI hit an unexpected error. Your data is saved locally — reloading usually resolves this."),
        React.createElement(
          "button",
          {
            onClick: () => window.location.reload(),
            style: { background: "#8B5CF6", color: "#fff", border: "none", borderRadius: 8, padding: "10px 18px", fontSize: 13.5, fontWeight: 600, cursor: "pointer" },
          },
          "Reload"
        )
      );
    }
    return this.props.children;
  }
}

const path = window.location.pathname;
const isShell = path === "/app" || path.startsWith("/app/") || path === "/social" || path.startsWith("/social/");
const Entry = isShell ? Shell : Website;

const root = createRoot(document.getElementById("root"));
root.render(
  React.createElement(ErrorBoundary, null, React.createElement(Suspense, { fallback: null }, React.createElement(Entry)))
);
