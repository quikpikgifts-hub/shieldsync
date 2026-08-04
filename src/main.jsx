import React, { Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";

// Lazy-loaded so each route's JS chunk (and only that chunk) reaches the browser.
// App.jsx is an internal demo with hardcoded seed credentials — it must never be
// part of the shared bundle that every real site visitor downloads.
const App = lazy(() => import("./App.jsx"));
const Website = lazy(() => import("./Website.jsx"));

const path = window.location.pathname;
const isApp = path === "/app" || path.startsWith("/app/");
const Entry = isApp ? App : Website;

const root = createRoot(document.getElementById("root"));
root.render(
  React.createElement(Suspense, { fallback: null }, React.createElement(Entry))
);
