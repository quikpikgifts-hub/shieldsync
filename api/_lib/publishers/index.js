import * as facebook from "./facebook.js";
import * as instagram from "./instagram.js";
import * as tiktok from "./tiktok.js";
import * as linkedin from "./linkedin.js";
import * as youtube from "./youtube.js";
import * as x from "./x.js";
import * as pinterest from "./pinterest.js";
import { CONNECTION_LABELS } from "./states.js";

const REGISTRY = { facebook, instagram, tiktok, linkedin, youtube, x, pinterest };

export function getPublisher(platformKey) {
  return REGISTRY[platformKey] || null;
}

export async function listPublishers() {
  return Promise.all(
    Object.values(REGISTRY).map(async (p) => {
      const { state } = await p.getConnectionState();
      return {
        platform: p.platform,
        state,
        label: CONNECTION_LABELS[state],
        // Kept for any caller still on the old boolean contract.
        configured: p.isConfigured(),
        requiredEnv: p.requiredEnv,
      };
    })
  );
}
