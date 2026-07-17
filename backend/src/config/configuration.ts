export interface AppConfig {
  nodeEnv: string;
  port: number;
  databaseUrl: string;
  jwt: {
    accessSecret: string;
    accessTtl: string;
    refreshTtlDays: number;
  };
  corsOrigins: string[];
  throttle: {
    ttlMs: number;
    limit: number;
  };
  frontendBaseUrl: string;
  redis: {
    url: string | null;
    enabled: boolean;
  };
  email: {
    smtpHost: string | null;
    smtpPort: number;
    smtpSecure: boolean;
    smtpUser: string | null;
    smtpPassword: string | null;
    fromAddress: string;
    fromName: string;
    enabled: boolean;
  };
  storage: {
    endpoint: string | null;
    region: string;
    bucket: string | null;
    accessKeyId: string | null;
    secretAccessKey: string | null;
    forcePathStyle: boolean;
    enabled: boolean;
  };
  sentry: {
    dsn: string | null;
    enabled: boolean;
  };
  security: {
    loginLockoutThreshold: number;
    loginLockoutWindowMinutes: number;
    loginLockoutDurationMinutes: number;
  };
  logLevel: string;
}

// A handful of integrations are "infrastructure, not vendor choice" (Redis, SMTP, S3) —
// unlike the third-party vendor extension points in src/integrations/ (Stripe, Twilio,
// etc.), which always throw until a real adapter is written, these degrade gracefully to
// an in-memory/direct-send fallback when unconfigured, so local dev and CI don't require
// standing up Postgres *and* Redis *and* an SMTP server *and* S3 just to boot the app.
// Every fallback is logged loudly at startup (see main.ts) and documented in
// OPEN_DECISIONS.md — this is a deliberate degrade-not-fail choice, not a silent gap.
export default (): { app: AppConfig } => ({
  app: {
    nodeEnv: process.env.NODE_ENV ?? "development",
    port: parseInt(process.env.PORT ?? "3001", 10),
    databaseUrl: process.env.DATABASE_URL ?? "",
    jwt: {
      accessSecret: process.env.JWT_ACCESS_SECRET ?? "",
      accessTtl: process.env.JWT_ACCESS_TTL ?? "15m",
      refreshTtlDays: parseInt(process.env.JWT_REFRESH_TTL_DAYS ?? "30", 10),
    },
    // Comma-separated list — local dev is legitimately loaded from both localhost and
    // 127.0.0.1, which CORS treats as distinct origins, so both need to be allowed rather
    // than picking one and having the other silently fail with an opaque "Failed to fetch".
    corsOrigins: (process.env.CORS_ORIGIN ?? "http://localhost:5173,http://127.0.0.1:5173")
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean),
    throttle: {
      ttlMs: parseInt(process.env.THROTTLE_TTL_MS ?? "60000", 10),
      limit: parseInt(process.env.THROTTLE_LIMIT ?? "100", 10),
    },
    frontendBaseUrl: process.env.FRONTEND_BASE_URL ?? "http://localhost:5173",
    redis: {
      url: process.env.REDIS_URL ?? null,
      enabled: Boolean(process.env.REDIS_URL),
    },
    email: {
      smtpHost: process.env.SMTP_HOST ?? null,
      smtpPort: parseInt(process.env.SMTP_PORT ?? "587", 10),
      smtpSecure: process.env.SMTP_SECURE === "true",
      smtpUser: process.env.SMTP_USER ?? null,
      smtpPassword: process.env.SMTP_PASSWORD ?? null,
      fromAddress: process.env.EMAIL_FROM_ADDRESS ?? "no-reply@ember.example.com",
      fromName: process.env.EMAIL_FROM_NAME ?? "Ember",
      enabled: Boolean(process.env.SMTP_HOST),
    },
    storage: {
      endpoint: process.env.S3_ENDPOINT ?? null,
      region: process.env.S3_REGION ?? "us-east-1",
      bucket: process.env.S3_BUCKET ?? null,
      accessKeyId: process.env.S3_ACCESS_KEY_ID ?? null,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? null,
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
      enabled: Boolean(process.env.S3_BUCKET),
    },
    sentry: {
      dsn: process.env.SENTRY_DSN ?? null,
      enabled: Boolean(process.env.SENTRY_DSN),
    },
    security: {
      loginLockoutThreshold: parseInt(process.env.LOGIN_LOCKOUT_THRESHOLD ?? "10", 10),
      loginLockoutWindowMinutes: parseInt(process.env.LOGIN_LOCKOUT_WINDOW_MINUTES ?? "15", 10),
      loginLockoutDurationMinutes: parseInt(process.env.LOGIN_LOCKOUT_DURATION_MINUTES ?? "15", 10),
    },
    logLevel: process.env.LOG_LEVEL ?? "info",
  },
});
