import * as Joi from "joi";

// Fails fast at boot if required configuration is missing or malformed, instead of
// surfacing as a confusing runtime error the first time a route needs it.
export const validationSchema = Joi.object({
  NODE_ENV: Joi.string().valid("development", "test", "production").default("development"),
  PORT: Joi.number().default(3001),
  DATABASE_URL: Joi.string().uri({ scheme: ["postgresql", "postgres"] }).required(),

  // Raised from 16 to 32: an HS256 signing key this short is within reach of offline
  // brute-force if it ever partially leaks or is guessed — see SECURITY_AUDIT.md L-2.
  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_TTL: Joi.string().default("15m"),
  JWT_REFRESH_TTL_DAYS: Joi.number().default(30),

  CORS_ORIGIN: Joi.string().default("http://localhost:5173,http://127.0.0.1:5173"),
  THROTTLE_TTL_MS: Joi.number().default(60000),
  THROTTLE_LIMIT: Joi.number().default(100),
  // Read directly via process.env in auth.controller.ts (see its comment) rather than
  // through ConfigService, for the same reason THROTTLE_TTL_MS/THROTTLE_LIMIT above are —
  // still declared here so they're validated and documented like every other env var.
  LOGIN_THROTTLE_TTL_MS: Joi.number().default(60000),
  LOGIN_THROTTLE_LIMIT: Joi.number().default(5),

  FRONTEND_BASE_URL: Joi.string().uri().default("http://localhost:5173"),

  // Redis — optional. Absent means every Redis-backed feature (distributed rate
  // limiting, account lockout, token blacklist, background queues) falls back to an
  // in-memory/direct equivalent. Fine for local dev/CI; required for a real multi-instance
  // production deployment — see PRODUCTION_READINESS.md.
  // `.allow("")` throughout this block: a deployment's env-file convention often sets an
  // unused variable to an empty string rather than omitting it entirely (that's exactly
  // what docker-compose.prod.yml's own `${S3_ENDPOINT}` interpolation produces when the
  // var is unset in the .env file) — without this, Joi's `.uri()` check would reject an
  // intentionally-blank optional value and the app would refuse to boot over nothing.
  REDIS_URL: Joi.string().uri({ scheme: ["redis", "rediss"] }).allow("").optional(),

  // SMTP — optional. Absent means EmailProvider resolves to NotConfiguredEmailProvider,
  // exactly like every other unconfigured integration in src/integrations/.
  SMTP_HOST: Joi.string().allow("").optional(),
  SMTP_PORT: Joi.number().default(587),
  SMTP_SECURE: Joi.string().valid("true", "false").default("false"),
  SMTP_USER: Joi.string().allow("").optional(),
  SMTP_PASSWORD: Joi.string().allow("").optional(),
  EMAIL_FROM_ADDRESS: Joi.string().email().default("no-reply@ember.example.com"),
  EMAIL_FROM_NAME: Joi.string().default("Ember"),

  // Object storage — optional. Absent means StorageProvider resolves to
  // NotConfiguredStorageProvider.
  S3_ENDPOINT: Joi.string().uri().allow("").optional(),
  S3_REGION: Joi.string().default("us-east-1"),
  S3_BUCKET: Joi.string().allow("").optional(),
  S3_ACCESS_KEY_ID: Joi.string().allow("").optional(),
  S3_SECRET_ACCESS_KEY: Joi.string().allow("").optional(),
  S3_FORCE_PATH_STYLE: Joi.string().valid("true", "false").default("false"),

  // Error tracking — optional.
  SENTRY_DSN: Joi.string().uri().allow("").optional(),

  // Account-lockout tuning (see SECURITY_AUDIT.md H-2's remediation).
  LOGIN_LOCKOUT_THRESHOLD: Joi.number().default(10),
  LOGIN_LOCKOUT_WINDOW_MINUTES: Joi.number().default(15),
  LOGIN_LOCKOUT_DURATION_MINUTES: Joi.number().default(15),

  LOG_LEVEL: Joi.string().valid("fatal", "error", "warn", "info", "debug", "trace", "silent").default("info"),

  // Read directly via process.env in health.controller.ts (see its comment) — declared
  // here purely so they're validated/documented alongside every other env var.
  HEALTH_HEAP_THRESHOLD_MB: Joi.number().default(1024),
  HEALTH_RSS_THRESHOLD_MB: Joi.number().default(1536),
});
