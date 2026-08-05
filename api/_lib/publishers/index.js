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
      const { state, lastVerifiedAt, displayName } = await p.getConnectionState();
      return {
        platform: p.platform,
        state,
        label: CONNECTION_LABELS[state],
        requiredEnv: p.requiredEnv,
        requiredScopes: p.requiredScopes || [],
        // OAuth flow existing at all is distinct from an account being connected —
        // only platforms with a real start/callback route (TikTok today) have one.
        oauthAvailable: typeof p.verifyConnection === "function",
        lastVerifiedAt: lastVerifiedAt || null,
        accountDisplayName: displayName || null,
        // Kept for any caller still on the old boolean contract.
        configured: p.isConfigured(),
      };
    })
  );
}

export async function verifyPublisherConnection(platformKey) {
  const publisher = getPublisher(platformKey);
  if (!publisher || typeof publisher.verifyConnection !== "function") {
    return { ok: false, reason: "not_available" };
  }
  return publisher.verifyConnection();
}
