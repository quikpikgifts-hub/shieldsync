import * as facebook from "./facebook.js";
import * as instagram from "./instagram.js";
import * as tiktok from "./tiktok.js";
import * as linkedin from "./linkedin.js";
import * as youtube from "./youtube.js";
import * as x from "./x.js";
import * as pinterest from "./pinterest.js";

const REGISTRY = { facebook, instagram, tiktok, linkedin, youtube, x, pinterest };

export function getPublisher(platformKey) {
  return REGISTRY[platformKey] || null;
}

export function listPublishers() {
  return Object.values(REGISTRY).map((p) => ({
    platform: p.platform,
    configured: p.isConfigured(),
    requiredEnv: p.requiredEnv,
  }));
}
