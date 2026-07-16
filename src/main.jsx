import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import Website from "./Website.jsx";
import Ember from "./Ember.jsx";

const path = window.location.pathname;
const isApp = path === "/app" || path.startsWith("/app/");
const isEmber = path === "/ember" || path.startsWith("/ember/");

const root = createRoot(document.getElementById("root"));
root.render(React.createElement(isApp ? App : isEmber ? Ember : Website));
