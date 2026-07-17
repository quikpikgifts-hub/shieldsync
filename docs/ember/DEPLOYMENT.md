# Ember Backend — Deployment Guide

## Local development (verified working)

This is the path actually exercised while building Phase 1 — every command below was run
for real against a real local PostgreSQL instance, not simulated.

```bash
cd backend
cp .env.example .env        # fill in a real DATABASE_URL and JWT_ACCESS_SECRET
npm install
npx prisma migrate dev      # creates/updates schema against DATABASE_URL
npx prisma db seed          # seeds the fixed RBAC catalog — required before registration works
npm run start:dev
```

The server starts on `PORT` (default `3001`). With `NODE_ENV` not `production`, the live
OpenAPI docs are at `http://localhost:3001/docs`.

### PostgreSQL for local development

Two supported paths:

**A. A local PostgreSQL install** (what this project was actually developed and tested
against): install PostgreSQL 16, then:

```sql
CREATE ROLE ember WITH LOGIN PASSWORD 'your_password' CREATEDB;
CREATE DATABASE ember_dev OWNER ember;
```

Point `DATABASE_URL` in `.env` at it.

**B. Docker Compose** (`docker-compose.yml` in this directory, provisions both Postgres
and the API):

```bash
docker compose up --build
```

**Known limitation of this repository's own build environment:** `docker compose config`
was used to validate the compose file's syntax, and it parses correctly. A full
`docker compose up` was **not** run end-to-end in the sandbox this backend was built in,
because that sandbox's network policy blocks the Docker Hub CDN outright (confirmed via
`docker run postgres:16-alpine` failing with a 403 from `production.cloudfront.docker.com`
— an environment network policy, not a problem with the compose file or Dockerfile). A
normal developer machine or CI runner with standard internet access does not have this
restriction. Treat option A as the verified path and option B as syntactically validated
but not yet run to completion in this specific environment.

### Running tests

```bash
npm test              # unit tests, mocked dependencies, no database needed
npm run test:e2e      # real HTTP requests against a real Postgres test database
```

`test:e2e` needs a second database (`ember_test` in this project's convention) migrated
and seeded the same way as the dev database, and a `.env.test` (see `.env.example` for the
shape) pointing at it. **Must run with `--runInBand`** (already the default in
`package.json`'s `test:e2e` script) — the e2e spec files share one database and running
them in parallel workers causes real transaction deadlocks and foreign-key races, not just
flakiness (this was hit and fixed during Phase 1 development).

## Production deployment

No production environment exists yet for this backend. When one is stood up:

1. Follow `docs/ember/ARCHITECTURE.md` §3 for the target infrastructure shape — a single
   managed container platform (e.g. ECS/Fargate) is recommended over Kubernetes until
   real scale justifies the added operational complexity.
2. Set every variable in `.env.example` via the platform's secrets manager — never bake
   real secrets into the Docker image or commit them.
3. Run `npx prisma migrate deploy` (not `migrate dev`) as a release step, using a
   database role scoped for migrations — see `SECURITY_NOTES.md` / `OPEN_DECISIONS.md`
   D-04 for why this should be a *different* role than the one the running application
   uses day-to-day.
4. Run `npx prisma db seed` once against a fresh database before the first deploy.
5. Set `NODE_ENV=production` — this disables the `/docs` Swagger UI (see
   `src/configure-app.ts`), which should not be publicly exposed in production.
6. Confirm every checklist item in `docs/ember/COMPLIANCE_CHECKLIST.md` that's still
   listed "Not started" before accepting real user data — this backend implements the
   *engineering* controls; the legal/compliance sign-offs are a separate, required step.
