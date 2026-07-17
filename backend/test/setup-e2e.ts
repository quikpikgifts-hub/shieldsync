import path from "node:path";
import fs from "node:fs";

// Loads .env.test for local runs. In CI, DATABASE_URL etc. are provided directly as
// job env vars (see .github/workflows/backend-ci.yml) so this file simply does nothing
// there — it never overrides already-set variables.
const envTestPath = path.join(__dirname, "..", ".env.test");
if (fs.existsSync(envTestPath)) {
  process.loadEnvFile(envTestPath);
}
