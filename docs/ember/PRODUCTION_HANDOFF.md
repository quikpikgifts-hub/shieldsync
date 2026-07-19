# Ember Backend — Production Handoff

Read this first. It exists so another engineer can pick up deployment and operation of this
system without needing anyone from this project's build history in the room. Everything it
references is real and current as of this writing — where something isn't done yet, this
document says so, and points at the doc that explains exactly what's missing and why.

## What this system is

Ember is a NestJS 11 / Prisma 6 / PostgreSQL 16 dating-platform backend, with Redis for
distributed rate limiting, account lockout, token blacklisting, and background jobs. Start
with `ARCHITECTURE.md` for the module structure and design rationale, `API.md` for every
endpoint, and `DATABASE_SCHEMA.md` for the real schema (not a planning document — it was
rewritten during RC-1 specifically to match `schema.prisma` exactly).

## Where things actually stand right now

**Code**: RC-1 complete. A full independent re-verification (backend code quality,
documentation-vs-implementation, security, logging) found and fixed one Critical
vulnerability and one High-severity gap, both now covered by regression tests. 90 automated
tests pass against real local PostgreSQL/Redis. See `ENTERPRISE_READINESS_REPORT.md` for
the full scorecard and `CHANGELOG.md` for exactly what changed.

**Operational validation**: real, but local-only. Phase 5 ran the actual compiled
application against real local Postgres/Redis/S3-compatible storage/SMTP-capture and
validated every functional flow (42/42 real checks — `backend/scripts/launch-verification.mjs`),
ran real load tests (`LOAD_TEST_REPORT.md`), real security checks against the live instance
(`PRODUCTION_SECURITY_REPORT.md`), and a real database backup/restore drill
(`DISASTER_RECOVERY_REPORT.md`). None of this touched real cloud infrastructure — there
wasn't any to touch.

**Infrastructure**: code-complete, not deployed. `infra/terraform/` describes the full AWS
stack (`AWS_SETUP_GUIDE.md` has the component-by-component breakdown), is `fmt`-clean and
manually reviewed (`TERRAFORM_READINESS.md`), but has never run `terraform init` in this
project's history — the build environment used throughout has had `registry.terraform.io`
blocked by network policy the whole time. **No AWS account, no domain, no email vendor
account exist that this project has ever had access to.**

**Bottom line as of the last full review** (`PRODUCTION_READINESS_REPORT.md`): **NO-GO**,
for exactly one reason — there is no real deployed environment for anyone to use. Not a
code-quality problem.

## How to actually deploy this, starting from nothing

Follow these documents in order:

1. **`AWS_SETUP_GUIDE.md`** — what a real AWS account needs, what Terraform creates
   automatically versus what needs manual setup first (an IAM deploy role, a chosen email
   vendor, a decision on GHCR vs. ECR for the container registry — three real gaps this
   document names specifically, not glossed over).
2. **`DEPLOYMENT_CHECKLIST.md`** — copy-paste-ready commands, in order, from an empty
   account through a smoke-tested live deployment, including rollback.
3. Once deployed, run `backend/scripts/launch-verification.mjs` against the real URL — the
   exact same script that produced 42/42 real passes locally in Phase 5. This is the actual
   bar for "does this work," not "did `terraform apply` exit 0."

## What it costs

`AWS_COST_ESTIMATE.md` — roughly $135-165/month at the Alpha sizing this project is
actually prepared for (the current Terraform defaults), scaling up through Beta and
Production tiers. Estimates only; validate against a real first month's bill.

## How to run it once it's live

`OPERATOR_RUNBOOK.md` — deploy, monitor, troubleshoot, roll back, rotate secrets, routine
maintenance. `OPERATIONS_RUNBOOK.md` — the incident-response companion: severity levels,
formal incident process, scaling procedures, and per-service failure modes (database
failover, Redis failure, SES failure, S3 failure, credential rotation table, security
incident response). Read both before going on call.

## What's still blocking a real launch, beyond infrastructure

Deploying infrastructure is necessary but not sufficient. Also required, per
`RC1_RELEASE_NOTES.md` and `PRODUCTION_READINESS_REPORT.md`:

- **A working report/block UI in the frontend** — the backend fully supports it and this
  project re-verified it works correctly (`ENTERPRISE_READINESS_REPORT.md`'s Frontend
  section), but no screen in `src/Ember.jsx` calls it. This matters more than most
  "known issues" — it's a trust & safety gap for a dating platform's real users, not a
  cosmetic one.
- **Legal documents** — Terms of Service, Privacy Policy, at minimum a lightweight version
  for a controlled alpha. Not an engineering deliverable; see
  `DEPLOYMENT_READINESS_CHECKLIST.md`'s Legal & Compliance section for who owns it.
- **A named on-call owner** who has read `OPERATOR_RUNBOOK.md` and `OPERATIONS_RUNBOOK.md`.
- **A support channel** testers can actually reach — see `ALPHA_TEST_PLAN.md`.
- **CloudWatch alarms** — `TERRAFORM_READINESS.md`'s single most significant finding: logs
  are collected but nothing alerts on them yet. Real, additive Terraform work, not yet
  written.

## Once all of the above is done

Run the alpha per `ALPHA_TEST_PLAN.md` — eligibility, tester onboarding, bug reporting,
escalation, rollback criteria, and success metrics for a 25-100 person controlled cohort.
Re-run `PRODUCTION_READINESS_REPORT.md`'s validation (the real load test, the real security
checks, the real launch-verification script) against the real deployed environment, and
revisit the GO/NO-GO call on that evidence — not on this document's summary of it.

## Full document index

| Document | What it's for |
|---|---|
| `ARCHITECTURE.md` | System design and module structure |
| `API.md` | Every endpoint, real and current |
| `DATABASE_SCHEMA.md` | The real schema, rewritten to match `schema.prisma` exactly |
| `SECURITY_NOTES.md` | Security controls actually implemented, updated through RC-1 |
| `LOGGING_AUDIT.md` | Every log call site, classified and sensitivity-reviewed |
| `CHANGELOG.md` | What changed, phase by phase, including every RC-1 fix |
| `OPEN_DECISIONS.md` | Unresolved product/legal/engineering decisions and their status |
| `ENTERPRISE_READINESS_REPORT.md` | RC-1 code/security scorecard, GO WITH CONDITIONS |
| `RC1_RELEASE_NOTES.md` | RC-1 summary: what's built, known limitations, launch blockers |
| `PRODUCTION_READINESS_REPORT.md` | Phase 5 synthesis: infra/security/perf/backup status, NO-GO |
| `LOAD_TEST_REPORT.md` | Real local load-test measurements |
| `PRODUCTION_SECURITY_REPORT.md` | Real security checks against a live local instance |
| `DISASTER_RECOVERY_REPORT.md` | Real backup/restore drill results |
| `ALPHA_TEST_PLAN.md` | The 25-100 person controlled alpha plan |
| `AWS_SETUP_GUIDE.md` | AWS prerequisites, what Terraform automates vs. what's manual |
| `TERRAFORM_READINESS.md` | Module-by-module Terraform review and findings |
| `DEPLOYMENT_CHECKLIST.md` | Copy-paste deployment steps, empty account to live |
| `AWS_COST_ESTIMATE.md` | Estimated monthly cost by tier |
| `OPERATOR_RUNBOOK.md` | Routine deploy/monitor/troubleshoot/rotate/maintain |
| `OPERATIONS_RUNBOOK.md` | Incident response, scaling, per-service failure modes |
| `DEPLOYMENT_READINESS_CHECKLIST.md` | Every external dependency, owner, acceptance criteria |
| `GO_LIVE_CHECKLIST.md` | Pre-launch verification pass, all areas |
| `infra/terraform/README.md` | Terraform usage instructions and validation status |
| `backend/scripts/launch-verification.mjs` | The real, reusable end-to-end smoke test |
| `PRE_LAUNCH_AUDIT.md` | Phase 7 fresh audit: credentials, dead code, deps, secrets, CORS, env validation — zero new findings |
| `RELEASE_INVENTORY.md` | Full accounting of source, infra, scripts, docs, tests, config, CI/CD, deps, licenses |
| `EXECUTIVE_READINESS_REPORT.md` | Business-level synthesis: completion, posture, risks, blockers, effort remaining |
| `FINAL_GO_LIVE_MATRIX.md` | Every production requirement — status, evidence, owner, blocking, next action |
| `RELEASE_PACKAGE/` | Curated 11-document release package (executive summary, diagrams, condensed guides) — start at `RELEASE_PACKAGE/EXECUTIVE_SUMMARY.md` |

If a document above contradicts another, treat the more recently dated `CHANGELOG.md` entry
as the tiebreaker, and fix the stale document — this project's own RC-1 pass found and
corrected exactly this kind of drift once already (`DATABASE_SCHEMA.md`'s rewrite); don't
let it happen silently again.
