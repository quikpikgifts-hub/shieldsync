// Meta Graph API — Instagram Content Publishing API.
// Activation requires: an Instagram Business/Creator account linked to a
// Facebook Page, a Meta app with the instagram_content_publish permission
// (App Review required), and a media URL that's publicly reachable (Meta
// fetches it server-side — data URLs / localhost won't work).
export const platform = "instagram";
export const requiredEnv = ["META_ACCESS_TOKEN", "META_INSTAGRAM_ACCOUNT_ID"];

export function isConfigured() {
  return requiredEnv.every((k) => Boolean(process.env[k]));
}

export async function publish({ caption, hashtags, mediaUrl }) {
  if (!isConfigured()) return { ok: false, reason: "not_configured", requiredEnv };
  if (!mediaUrl) return { ok: false, reason: "media_required" }; // Instagram publishing requires an image/video
  // TODO: two-step Content Publishing API call — POST /{ig-user-id}/media to
  // create a container, then POST /{ig-user-id}/media_publish with the
  // container id, once credentials exist.
  return { ok: false, reason: "not_implemented" };
}
