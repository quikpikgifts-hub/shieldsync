// TikTok Content Posting API.
// Activation requires: a TikTok for Developers app, the video.publish scope
// (audited separately from sandbox access), and per-user OAuth — TikTok
// tokens are issued per creator account, not one app-wide token.
export const platform = "tiktok";
export const requiredEnv = ["TIKTOK_CLIENT_KEY", "TIKTOK_CLIENT_SECRET"];

export function isConfigured() {
  return requiredEnv.every((k) => Boolean(process.env[k]));
}

export async function publish({ caption, hashtags, mediaUrl, userAccessToken }) {
  if (!isConfigured()) return { ok: false, reason: "not_configured", requiredEnv };
  if (!mediaUrl) return { ok: false, reason: "media_required" }; // TikTok posts are video-only
  if (!userAccessToken) return { ok: false, reason: "account_not_connected" }; // per-creator OAuth token, not app-wide
  // TODO: POST /v2/post/publish/video/init/ then upload, once the OAuth
  // flow issuing userAccessToken per connected creator account exists.
  return { ok: false, reason: "not_implemented" };
}
