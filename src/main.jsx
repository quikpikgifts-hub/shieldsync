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

const path = window.location.pathname;
const isShell = path === "/app" || path.startsWith("/app/") || path === "/social" || path.startsWith("/social/");
const Entry = isShell ? Shell : Website;

const root = createRoot(document.getElementById("root"));
root.render(
  React.createElement(Suspense, { fallback: null }, React.createElement(Entry))
);
