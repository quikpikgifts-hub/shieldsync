import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import Website from "./Website.jsx";

const path = window.location.pathname;
const isApp = path === "/app" || path.startsWith("/app/");

const root = createRoot(document.getElementById("root"));
root.render(React.createElement(isApp ? App : Website));
