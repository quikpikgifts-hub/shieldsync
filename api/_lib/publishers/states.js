// Four honest connection states, shown to the founder instead of a
// pretend "connected" boolean — see EXECUTIVE DIRECTIVE, "PLATFORM
// CONNECTIONS": never show broken UI or placeholder data pretending
// to be live.
export const CONNECTION_STATES = {
  // No app-level credentials provided at all (e.g. TIKTOK_CLIENT_KEY unset).
  WAITING_FOR_CREDENTIALS: "waiting_for_credentials",
  // App-level credentials exist, but publish() isn't fully implemented yet
  // and/or more one-time platform setup is required beyond a simple
  // "connect account" click (e.g. Instagram needs a linked Facebook Page).
  CONFIGURATION_REQUIRED: "configuration_required",
  // App-level credentials exist, publish() is fully implemented, and the
  // only remaining step is the founder clicking "Connect account" (OAuth).
  READY_TO_ACTIVATE: "ready_to_activate",
  // A real, currently-valid account token is stored — publishing would
  // actually attempt to post.
  CONNECTED: "connected",
};

export const CONNECTION_LABELS = {
  [CONNECTION_STATES.WAITING_FOR_CREDENTIALS]: "Waiting for Credentials",
  [CONNECTION_STATES.CONFIGURATION_REQUIRED]: "Configuration Required",
  [CONNECTION_STATES.READY_TO_ACTIVATE]: "Ready to Activate",
  [CONNECTION_STATES.CONNECTED]: "Connected",
};

// Shared by every publisher whose publish() is still a stub (no OAuth
// account-connection flow built yet) — credentials-only gating. Once a
// platform gets its own real OAuth flow (like tiktok.js), it defines its
// own getConnectionState() instead of using this.
export function configOnlyConnectionState(isConfigured) {
  return { state: isConfigured() ? CONNECTION_STATES.CONFIGURATION_REQUIRED : CONNECTION_STATES.WAITING_FOR_CREDENTIALS };
}
