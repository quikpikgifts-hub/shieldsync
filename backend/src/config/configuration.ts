export interface AppConfig {
  nodeEnv: string;
  port: number;
  databaseUrl: string;
  jwt: {
    accessSecret: string;
    accessTtl: string;
    refreshTtlDays: number;
  };
  corsOrigin: string;
  throttle: {
    ttlMs: number;
    limit: number;
  };
}

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
    corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
    throttle: {
      ttlMs: parseInt(process.env.THROTTLE_TTL_MS ?? "60000", 10),
      limit: parseInt(process.env.THROTTLE_LIMIT ?? "100", 10),
    },
  },
});
