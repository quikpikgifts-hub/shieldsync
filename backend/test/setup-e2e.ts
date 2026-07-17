import Redis from "ioredis";

// .env.test is loaded via `node --env-file=.env.test` in the `test:e2e` npm script (see
// package.json), not via in-code `process.loadEnvFile()` here. That was tried first and
// turned out to be genuinely unreliable inside Jest's per-file module/environment
// lifecycle — depending on file execution order, `configuration.ts` would sometimes read
// `.env` (the dev file, auto-loaded by @nestjs/config's own internal dotenv fallback)
// before this file's `loadEnvFile()` call had taken effect, silently pointing e2e tests
// at the *development* database instead of the isolated test one. `--env-file` sets the
// real OS-level process environment before Node (and therefore Jest, ts-jest, and every
// module they load) starts running any code at all, which has none of that ambiguity.
//
// This check is the safety net for that specific failure mode: if someone runs
// `npx jest` directly instead of `npm run test:e2e`, NODE_ENV won't be "test", and this
// fails loudly instead of silently truncating tables in whatever database DATABASE_URL
// happens to already point at.
if (process.env.NODE_ENV !== "test") {
  throw new Error(
    "e2e tests must be run via `npm run test:e2e` (which loads .env.test through " +
      "`node --env-file`), not `npx jest` directly — otherwise DATABASE_URL may point at " +
      "the development database, and these tests TRUNCATE every app table before each test.",
  );
}

// Each e2e-spec file gets a fresh Postgres state via resetDatabase() in its own
// beforeEach, but Redis-backed state (rate-limit counters, account-lockout counters,
// token blacklist entries) isn't tied to any one file's Prisma-managed tables — without
// this, state from one spec file could bleed into another's assertions, since REDIS_URL
// points at one shared logical database for the whole test run, not a fresh one per file.
beforeAll(async () => {
  if (!process.env.REDIS_URL) return;
  const redis = new Redis(process.env.REDIS_URL);
  await redis.flushdb();
  await redis.quit();
});
