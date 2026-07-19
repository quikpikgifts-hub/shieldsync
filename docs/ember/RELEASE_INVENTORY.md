# Ember Backend — Release Inventory

A full accounting of everything in this release, with real counts pulled from the
repository this pass, not estimated. **Scope note**: this repository (`operacore-platform`
per its root `package.json`) hosts multiple unrelated products — ShieldSync (a physical
security dashboard, `src/App.jsx`) and a marketing/booking site (`src/Website.jsx`,
`api/*.js`) alongside Ember. This inventory covers **only Ember** — `backend/`,
`src/Ember.jsx`, `src/emberApi.js`, and `docs/ember/`. The other products are unrelated,
pre-existing, and out of scope for every Ember release document in this series.

## Source code

- **Backend**: 111 TypeScript files under `backend/src/` (NestJS 11 application) — auth,
  users, profiles, matching, messaging, safety (reports/blocks/moderation), audit, health,
  observability, integrations (email/storage + 6 documented `NotConfigured*` extension-point
  stubs), redis, queue, prisma, config, common (guards/filters/decorators/utils).
- **Frontend**: `src/Ember.jsx` (1,298 lines) + `src/emberApi.js` (156 lines) — a real
  client wired against the real backend API (verified matching `API.md` exactly during
  RC-1), no mock data.

## Infrastructure

- **Terraform**: 27 `.tf` files under `backend/infra/terraform/` — root module plus 7
  child modules (`networking`, `database`, `cache`, `storage`, `secrets`, `ecs`, `dns`).
  `fmt`-clean; `init`/`plan`/`apply` never run (see `PRODUCTION_READINESS_REPORT.md`).
- **Kubernetes**: 6 files under `backend/k8s/` — reference manifests only, explicitly not
  the recommended deploy target (`k8s/README.md`, `ARCHITECTURE.md` §3 both state this).
- **Docker**: `Dockerfile` (multi-stage, non-root runtime user), `docker-compose.yml`
  (local dev), `docker-compose.prod.yml` (production-shape compose, credential-injected via
  `${VAR}` interpolation).

## Scripts

- `backend/scripts/launch-verification.mjs` — the real, reusable 42-check end-to-end smoke
  test (Phase 5/7), parameterized to run against local or real deployed environments.
- `backend/prisma/seed.ts` — RBAC catalog seed (4 roles, 8 permissions).

## Documentation

37 files under `docs/ember/` as of this pass, spanning planning (`ARCHITECTURE.md`,
`DATABASE_SCHEMA.md`, `THREAT_MODEL.md`, `ROADMAP.md`), build-phase audits
(`SECURITY_AUDIT.md`, `API_AUDIT.md`, `DATABASE_AUDIT.md`), operational references
(`API.md`, `SECURITY_NOTES.md`, `DEPLOYMENT.md`, `OPERATOR_RUNBOOK.md`,
`OPERATIONS_RUNBOOK.md`, `TESTING.md`), and the RC-1/Phase 5-7 verification series
(`RC1_RELEASE_NOTES.md`, `ENTERPRISE_READINESS_REPORT.md`, `LOGGING_AUDIT.md`,
`PRODUCTION_READINESS_REPORT.md`, `LOAD_TEST_REPORT.md`, `PRODUCTION_SECURITY_REPORT.md`,
`DISASTER_RECOVERY_REPORT.md`, `ALPHA_TEST_PLAN.md`, `AWS_SETUP_GUIDE.md`,
`TERRAFORM_READINESS.md`, `DEPLOYMENT_CHECKLIST.md`, `AWS_COST_ESTIMATE.md`,
`PRODUCTION_HANDOFF.md`, plus this document and its Phase 7 siblings). See
`PRODUCTION_HANDOFF.md` for the full indexed table and reading order.

## Test suites

- **Unit**: 4 spec files, 23 tests (`auth.service.spec.ts`, `thumbnail.service.spec.ts`,
  `s3-storage.provider.spec.ts`, `smtp-email.provider.spec.ts`).
- **E2E**: 8 spec files, 67 tests (`auth`, `matching`, `safety`, `profiles`,
  `verification-and-password-reset`, `photo-storage`, `observability`, `health`) — run
  against real local PostgreSQL, Redis, and (for `photo-storage`) a real local
  S3-compatible server.
- **Total: 90 automated tests**, all re-confirmed passing fresh this pass (see
  `PRE_LAUNCH_AUDIT.md`) against real infrastructure, not mocks.

## Configuration

- `.env.example` — every environment variable documented with a `CHANGE_ME`/blank
  placeholder, never a real value.
- `k8s/secret.example.yaml`, `k8s/configmap.yaml` — Kubernetes reference config (unused
  deploy path, kept for reference per `k8s/README.md`).
- `environments/production.tfvars.example` — Terraform variable template.
- `backend/prisma/schema.prisma` — the real, single-source-of-truth database schema.

## CI/CD

- `.github/workflows/backend-ci.yml` — lint, `npm audit`, build, unit + e2e tests against
  real Postgres/Redis service containers, Docker build sanity check. Gates every push/PR.
- `.github/workflows/backend-deploy.yml` — build, push to GHCR, migrate, then a real
  credential-gated ECS deployment (GitHub OIDC → `aws ecs update-service` → health-check
  validation) once `AWS_DEPLOY_ROLE_ARN` + repository variables exist; reports "not
  configured yet" otherwise rather than silently no-op'ing. Never run against real
  infrastructure (see `PRODUCTION_READINESS_REPORT.md`).

## Assets

No binary/media assets ship as part of the Ember backend or its API client — photos are
user-uploaded at runtime to object storage, never bundled. No static asset pipeline exists
in `backend/` (it's an API-only service; `src/Ember.jsx` is a React component consumed by
whatever build pipeline the broader `operacore-platform` repo root uses, not a
Ember-specific asset build).

## Licenses

- **Ember backend**: `backend/package.json` declares `"license": "UNLICENSED"` — no public
  license granted, proprietary by default. **No `LICENSE` file exists anywhere in this
  repository** (checked at both repo root and `backend/`) — worth closing before any
  external distribution beyond a controlled alpha, even though a controlled alpha handing
  users a hosted service (not source code) doesn't strictly require one. Flagged here as an
  inventory gap, not assumed resolved.
- **Third-party dependencies**: 30 production + 24 development npm dependencies (backend).
  **No formal dependency-license audit has been performed** — the vast majority of the
  NestJS/Prisma ecosystem is MIT/Apache-2.0 licensed (compatible with a proprietary
  application bundling them), but this has not been verified dependency-by-dependency. A
  real gap if the organization has a formal open-source-license-compliance process; not
  performed in any phase of this project to date.

## Dependencies

- **Backend production**: 30 packages (`@nestjs/*`, `@prisma/client`, `argon2`,
  `@aws-sdk/client-s3` + `s3-request-presigner`, `nodemailer`, `ioredis`, `bullmq`,
  `pino`/`pino-http`/`nestjs-pino`, `@sentry/node`, `prom-client`, `class-validator`/
  `class-transformer`, `helmet`, `passport`/`passport-jwt`, etc.).
- **Backend development**: 24 packages (post-RC-1 cleanup — `ts-loader`, `tsconfig-paths`,
  `source-map-support` removed as confirmed-unused; `jest`/`ts-jest`/`supertest`,
  `eslint`/`@typescript-eslint/*`, `prisma` CLI, `s3rver`/`smtp-server`/`mailparser` for
  real-local-server e2e testing).
- **`npm audit --omit=dev --audit-level=high`**: 0 vulnerabilities (re-confirmed this
  pass). A full `npm audit` (including devDependencies) shows 4 pre-existing findings
  confined to `s3rver`'s transitive test-only dependencies — documented in RC-1's
  `CHANGELOG.md` entry, unchanged, not shipped to production.

## What's explicitly not in this inventory

Anything belonging to ShieldSync or the marketing/booking site (`src/App.jsx`,
`src/Website.jsx`, `api/*.js`, `styles.css`, `supabase/`, `ops/`, the PDF files at repo
root) — unrelated products sharing this repository, never touched by any Ember-focused
work in this project.
