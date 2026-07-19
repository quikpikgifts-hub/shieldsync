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

### Local development with Redis, email, and object storage (optional)

All three are optional locally — every feature that needs them degrades gracefully (see
`configuration.ts`'s header comment) when unconfigured. To exercise the real paths:

- **Redis:** `redis-server` locally, or `docker compose up redis`; set `REDIS_URL` in `.env`.
- **Email:** point `SMTP_HOST`/`SMTP_PORT`/etc. at any real SMTP server, or a local dev
  mailcatcher (e.g. MailHog/Mailpit) if you just want to see what would be sent without a
  real provider.
- **Object storage:** either real AWS S3 credentials, or a local S3-compatible service
  (MinIO) with `S3_ENDPOINT`/`S3_FORCE_PATH_STYLE=true` set.

### Running tests

```bash
npm test              # unit tests, mocked dependencies, no database needed
npm run test:e2e      # real HTTP requests against a real Postgres test database
```

`test:e2e` needs a second database (`ember_test` in this project's convention) migrated
and seeded the same way as the dev database, and a `.env.test` (see `.env.example` for the
shape) pointing at it. **Always run via `npm run test:e2e`, never `npx jest` directly** —
the script loads `.env.test` via `node --env-file-if-exists`, which is load-bearing, not a
style choice; see `TESTING.md` for why. **Must run with `--runInBand`** (already the
default in `package.json`'s `test:e2e` script) — the e2e spec files share one database and
running them in parallel workers causes real transaction deadlocks and foreign-key races,
not just flakiness (this was hit and fixed during Phase 1 development).

## CI/CD

`.github/workflows/backend-ci.yml` gates every push/PR (lint, `npm audit --omit=dev`,
build, unit + e2e tests against real Postgres + Redis service containers, a Docker build
sanity check). `.github/workflows/backend-deploy.yml` runs on push to `main`: builds and
pushes a tagged image to GitHub Container Registry, runs `prisma migrate deploy` against a
`production` GitHub Environment, then — provided the `AWS_DEPLOY_ROLE_ARN` secret and
`ECS_CLUSTER_NAME`/`ECS_SERVICE_NAME`/`API_URL` repository variables are set — authenticates
to AWS via GitHub OIDC and runs a real `aws ecs update-service` / `wait services-stable` /
`GET /ready` validation sequence. See `RELEASE.md` for the full release/rollback process and
`OPERATOR_RUNBOOK.md`'s "Deploy" section for the exact commands. **This has not been run
against a real AWS account** — no production hosting target exists yet (below is still
accurate) — so the workflow is code complete, not operationally verified; until the secret/
variables above are set, its final step reports exactly that instead of silently no-op'ing.

## Production deployment

No production environment exists yet for this backend. When one is stood up:

1. Follow `docs/ember/ARCHITECTURE.md` §3 for the target infrastructure shape — a single
   managed container platform (e.g. ECS/Fargate) is recommended over Kubernetes until
   real scale justifies the added operational complexity. Basic Kubernetes manifests exist
   in `backend/k8s/` as a portability reference (see `k8s/README.md`), not a recommendation
   to use them.
2. Set every variable in `.env.example` via the platform's secrets manager — never bake
   real secrets into the Docker image or commit them. `docker-compose.prod.yml` and
   `backend/k8s/secret.example.yaml` show the expected shape, not real values.
3. Configure `REDIS_URL` pointing at a managed Redis instance — required for correct
   behavior across more than one API instance (distributed rate limiting, account
   lockout, token blacklist, background job queue all depend on it being shared).
4. Configure `SMTP_HOST`/etc. (any SMTP-speaking transactional email provider) and
   `S3_BUCKET`/etc. (real AWS S3 or an S3-compatible service) — without these, email
   verification/password reset and photo upload don't functionally work end-to-end, even
   though the rest of the API does.
5. Run `npx prisma migrate deploy` (not `migrate dev`) as a release step, using a
   database role scoped for migrations — see `SECURITY_NOTES.md` / `OPEN_DECISIONS.md`
   D-04 for why this should be a *different* role than the one the running application
   uses day-to-day.
6. Run `npx prisma db seed` once against a fresh database before the first deploy.
7. Set `NODE_ENV=production` — this disables the `/docs` Swagger UI (see
   `src/configure-app.ts`), which should not be publicly exposed in production.
8. Point the platform's health checks at `/live` (liveness) and `/ready` (readiness) —
   see `src/health/health.controller.ts`. Point `SENTRY_DSN` at a real Sentry project if
   error tracking is wanted; it's a no-op otherwise.
9. Confirm every checklist item in `docs/ember/COMPLIANCE_CHECKLIST.md` that's still
   listed "Not started" before accepting real user data — this backend implements the
   *engineering* controls; the legal/compliance sign-offs are a separate, required step.
