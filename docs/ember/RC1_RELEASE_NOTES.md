# Ember Backend — RC-1 Release Notes

Release candidate for a controlled external alpha test. This document summarizes what's
built, what was verified this pass, what's explicitly not done, and what stands between
this state and a real production launch.

**Four-state framework used throughout** (see `GO_LIVE_CHECKLIST.md` for the full
definitions): **Code complete** (logic correct, tested against real local infrastructure) →
**Infrastructure complete** (IaC exists, reviewed) → **Operationally verified** (the real
resource exists and a specific check passed against it) → **Production ready** (verified
*and* proven under realistic conditions — a drill, not just a resource existing).

---

## Completed functionality

Auth (registration, login, refresh-token rotation with reuse detection, logout with
access-token blacklisting, email verification, password reset with full session
revocation, new-device login alerts), RBAC (role/permission join tables, checked live per
request), profiles (create/update, preferences, prompt answers), photo upload (presigned
S3-compatible upload → ownership-validated registration → async thumbnail generation →
signed-URL reads, content-type allowlisted), matching (like/pass/super-like, mutual-match
detection, block-aware candidate filtering), messaging (per-match conversations, block-aware
send/list), trust & safety (reports auto-aggregating into moderator-assignable moderation
cases, blocking, audit logging), health/readiness/liveness endpoints, Prometheus metrics,
structured JSON logging, Sentry error tracking, Redis-backed distributed rate limiting and
account lockout, BullMQ background jobs (falls back to in-process retry when Redis isn't
configured), Docker + Docker Compose, Kubernetes reference manifests (not the recommended
deploy target — see `ARCHITECTURE.md` §3), GitHub Actions CI (lint/audit/build/test/Docker
build gate on every push) and CD (build → push to GHCR → migrate → credential-gated ECS
deploy), and a full AWS Terraform module tree.

**Code complete** for all of the above — verified against real local PostgreSQL and Redis
instances (not mocks), not against production infrastructure (none exists).

## Security improvements this pass (RC-1)

- **[Critical, fixed]** Cross-tenant photo hijack: a `storageKey` read out of another
  user's response (candidate deck, likes-received, public profile) could be registered as
  the reader's own photo, then deleted — destroying the original owner's photo. Fixed by
  validating storageKey ownership on registration and no longer exposing raw storage keys
  in any response. Two new regression tests added.
- **[High, fixed]** `POST /auth/register` and `POST /auth/email/verification/request` had
  no endpoint-specific rate limit. Both now carry the same 5/min-per-IP throttle as login.
- **[Informational, fixed]** Five log call sites passed a raw `Error` object rather than
  its message; a shared helper now scrubs any `scheme://user:pass@host`-shaped substring
  before logging, closing a theoretical connection-string-in-logs exposure at every "log an
  unexpected error" call site in one place.
- **[Low, tracked, not fixed this pass]** `ModerationService.assign` doesn't verify the
  target `assigneeId` actually holds moderation permissions before assigning a case to
  them — a case-routing data-integrity issue, not an authorization bypass (the assignee
  still can't act without their own grant). Deferred as out of RC-1's Critical/High-only
  fix scope; tracked for the next pass.

Full findings, including everything independently re-verified as already correct (JWT
lifecycle, refresh-token rotation/reuse detection, live ban/suspend enforcement,
Redis-fail-closed behavior, argon2id hashing, timing-safe login, IDOR checks on every
"my resource" endpoint, S3 bucket/IAM scoping, CI/CD OIDC scope, Terraform secrets
handling): see the RC-1 security review findings folded into `SECURITY_NOTES.md` and
`docs/ember/LOGGING_AUDIT.md`.

## Architecture summary

NestJS 11 modular monolith, Prisma 6/PostgreSQL 16 as the system of record, Redis 7
(optional but required for real multi-instance deployment) for distributed rate limiting,
account lockout, token blacklisting, and BullMQ queues. Every third-party integration
(payments, SMS, identity verification, AI, push notifications, analytics) is a documented
`NotConfigured*` extension-point stub — a deliberate design pattern, not an oversight — with
email and object storage the two integrations that graduated to real, tested adapters.
Deployment target is a single managed container platform (ECS/Fargate), not Kubernetes —
`backend/k8s/` is reference-only. Full detail: `ARCHITECTURE.md`.

**Frontend note:** `src/Ember.jsx`/`src/emberApi.js` (in this same repository, alongside the
unrelated ShieldSync/marketing apps this repo also hosts) is a real, working client against
the real backend — no mock data. Its API wrapper (`emberApi.js`) correctly implements
auth/profile/matching/messaging calls matching `API.md` exactly. **Gap found this pass:**
`emberApi.js` exports working, tested `createReport`/`createBlock`/`getMe`/`isLoggedIn`
functions that **no UI screen in `Ember.jsx` currently calls** — there is no in-app way for
a user to file a report or block another user, despite the landing copy explicitly
promising "Reports reviewed by a person, within 24h." For a dating-app alpha, this is a
real trust & safety gap worth closing before or immediately after opening access, not a
cosmetic one — flagged here rather than silently left for a UI screen to eventually catch
up to what the backend already fully supports and tests.

## Infrastructure summary

AWS Terraform module tree (VPC/networking, RDS Postgres, ElastiCache Redis, S3, Secrets
Manager, ECS/Fargate + ALB, optional Route53/ACM) — **infrastructure complete**:
`terraform fmt -check -recursive` passes, every resource manually reviewed against the AWS
provider schema, one circular-dependency bug and one `timestamp()` anti-pattern found and
fixed during writing. **Not operationally verified**: `terraform init/validate/plan/apply`
have never run — `registry.terraform.io` is blocked by this build environment's network
policy — and no AWS account exists. See `infra/terraform/README.md`.

## Testing summary

**90 automated tests** (23 unit + 67 e2e — up from 89 after two new RC-1 regression tests),
**all passing this pass against real local PostgreSQL and Redis instances** (not mocks,
not Docker containers — this sandbox's Docker daemon won't start, so Postgres/Redis were
run as native local services instead; see `TESTING.md`). Lint: 0 errors, 3 pre-existing
warnings (test-file `any` types). Build: clean. `npm audit --omit=dev --audit-level=high`:
0 vulnerabilities (this is the CI gate). A full `npm audit` (including devDependencies)
shows 4 pre-existing findings (1 moderate, 3 high) confined to `s3rver`'s transitive deps
(`busboy`/`dicer`/`fast-xml-parser`) — a dev-only local S3-compatible test-mock server, not
shipped to production, already excluded by the CI gate; not force-upgraded this pass since
the available fix is a breaking major-version change to a test dependency, out of RC-1's
verify-don't-expand scope.

## Known limitations

- No in-app report/block UI (see Frontend note above) despite full backend support.
- No column-level database encryption; disk-level encryption depends on real RDS
  (`storage_encrypted = true` in Terraform, not yet applied); TLS-in-transit to Postgres is
  not explicitly configured or verified at the application layer.
- `AuditLog` is append-only at the application layer only — no database-role-level
  `REVOKE` enforces it yet (`OPEN_DECISIONS.md` D-04).
- No automated data-retention/purge job for any table; `AuditLog` grows unboundedly.
- No hard-delete/right-to-erasure or data-export workflow — account deletion is soft-delete
  only.
- Redis outages fail closed for auth (lockout/blacklist/throttle all require Redis when
  configured) rather than degrading gracefully — an availability tradeoff, not a security
  gap, worth knowing operationally.
- Match-candidate filtering is an in-application filter over a fetched pool, not
  index-backed — a deliberate simplification, will need revisiting if candidate volume
  grows materially.

## Operational dependencies

A named on-call owner/rotation, `OPERATOR_RUNBOOK.md` read by whoever is on call, a
monitored support channel, and a real moderator/admin account granted directly against the
production database (no self-service admin-grant endpoint exists by design — see
`OPEN_DECISIONS.md` D-03).

## Infrastructure dependencies

AWS account with billing active; `terraform apply` run for real; Terraform remote state
backend (S3 + DynamoDB, not yet configured — local state only today); domain ownership +
DNS delegation; ACM certificate. Full worklist with owners and acceptance criteria:
`DEPLOYMENT_READINESS_CHECKLIST.md`.

## Third-party services required

Transactional email vendor (SMTP-compatible — Postmark/SES/SendGrid, not yet chosen), error
tracking (Sentry — code-ready, no project created), object storage (real S3 bucket, not yet
provisioned). Explicitly out of scope for this launch, by design: payments (Stripe),
identity verification, SMS, push notifications, analytics — all real, tested extension
points with no vendor wired.

## Remaining launch blockers

1. No AWS account / no `terraform apply` run — infrastructure is code, not resources.
2. No email/storage/monitoring vendor accounts.
3. No domain, DNS, or TLS certificate.
4. Terms of Service, Privacy Policy, and age-assurance policy are not drafted/reviewed by
   counsel — explicitly not an engineering deliverable.
5. No in-app report/block UI — a real trust & safety gap for a dating-app alpha (see above).
6. No named on-call/incident-response owner or support channel.

None of these are code defects — every one requires an external account, a legal review, a
short UI addition, or an organizational decision this engineering pass cannot manufacture.
See `DEPLOYMENT_READINESS_CHECKLIST.md` and `GO_LIVE_CHECKLIST.md` for the full, owned
worklist and acceptance criteria for each.

## Post-launch roadmap

See `ROADMAP.md` for the full phasing. Near-term candidates once external alpha begins:
compatibility scoring (currently unscored — `OPEN_DECISIONS.md` D-08), unmatch capability
(`Match.unmatchedAt` exists in the schema but no code path sets it — D-06), database-role-
level audit-log append-only enforcement, automated data retention/export/erasure workflows,
identity verification, and the report/block UI gap called out above.
