import path from "node:path";
import fs from "node:fs";
import type { PrismaConfig } from "prisma";

// Prisma 6 does not auto-load .env when a prisma.config.ts is present, so this
// project loads it explicitly here rather than adding a dotenv dependency —
// Node 20.6+ supports process.loadEnvFile() natively.
const envPath = path.join(__dirname, ".env");
if (fs.existsSync(envPath)) {
  process.loadEnvFile(envPath);
}

export default {
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    seed: "ts-node prisma/seed.ts",
  },
} satisfies PrismaConfig;
