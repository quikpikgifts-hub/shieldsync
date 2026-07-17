import * as Sentry from "@sentry/node";
import type { AppConfig } from "../config/configuration";

let initialized = false;

/**
 * A no-op until SENTRY_DSN is set — same "degrade gracefully, don't fail" pattern as
 * Redis/SMTP/S3 (see configuration.ts's header comment), since error tracking is
 * genuinely optional for local dev/CI but should be one env var away from working in a
 * real deployment.
 */
export function initSentry(config: Pick<AppConfig, "sentry" | "nodeEnv">): void {
  if (!config.sentry.enabled || !config.sentry.dsn) return;

  Sentry.init({
    dsn: config.sentry.dsn,
    environment: config.nodeEnv,
    // Tracing/profiling is a bigger commitment (sampling strategy, cost) than "capture
    // unhandled exceptions" — left at 0 (error tracking only) rather than guessing at a
    // sample rate with no real traffic to base it on. Revisit alongside
    // PRODUCTION_READINESS.md's broader observability rollout.
    tracesSampleRate: 0,
  });
  initialized = true;
}

export function captureException(error: unknown): void {
  if (!initialized) return;
  Sentry.captureException(error);
}
