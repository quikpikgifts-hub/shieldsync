import React, { Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";

const path = window.location.pathname;
const isApp = path === "/app" || path.startsWith("/app/");

// Code-split: marketing visitors never download the dashboard bundle, and vice versa.
const Component = lazy(() => (isApp ? import("./App.jsx") : import("./Website.jsx")));

const root = createRoot(document.getElementById("root"));
root.render(
  React.createElement(
    Suspense,
    { fallback: null },
    React.createElement(Component)
  )
);
