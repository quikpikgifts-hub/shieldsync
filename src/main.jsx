import React, { Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";

const Website = lazy(() => import("./Website.jsx"));
const Shell = lazy(() => import("./shell/Shell.jsx"));
const ProductionHub = lazy(() => import("./ProductionHub.jsx"));

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error("[Quik Pik Production] Render error:", error, info?.componentStack); }
  render() {
    if (this.state.error) return React.createElement("div", {style:{minHeight:"100vh",display:"grid",placeItems:"center",padding:24,textAlign:"center",background:"#091d32",color:"#fff",fontFamily:"sans-serif"}}, React.createElement("div", null, React.createElement("h2", null, "Quik Pik Production"), React.createElement("p", null, "Something went wrong. Please reload."), React.createElement("button",{onClick:()=>window.location.reload()},"Reload")));
    return this.props.children;
  }
}

const path = window.location.pathname;
const isShell = path === "/app" || path.startsWith("/app/") || path === "/social" || path.startsWith("/social/");
const Entry = isShell ? Shell : (path === "/veridian" || path.startsWith("/veridian/") || path === "/dashboard" || path.startsWith("/dashboard/")) ? Website : ProductionHub;
createRoot(document.getElementById("root")).render(React.createElement(ErrorBoundary, null, React.createElement(Suspense, { fallback: React.createElement("div", {style:{background:"#091d32",minHeight:"100vh"}}) }, React.createElement(Entry))));
