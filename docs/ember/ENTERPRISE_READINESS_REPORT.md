# Ember Backend — Enterprise Readiness Report (RC-1)

Independent scoring pass, produced as part of the RC-1 verification sweep. Every score
below is anchored to specific, cited evidence from this pass or prior audits — not a
subjective impression. Uses the same four-state framework as every other RC-1 document:
**Code complete → Infrastructure complete → Operationally verified → Production ready.**
A category can score well on code/design quality while scoring poorly on operational
readiness — these are measured separately throughout, deliberately not averaged together
into a false sense of "done."

Scale: 0-10. 8-10 strong, 6-7 adequate with named gaps, 4-5 real gaps requiring work,
0-3 not started/broken.

---

## Architecture — 8.5/10

Modular NestJS structure with a consistent, documented extension-point pattern
(`NotConfigured*` stubs for every unwired third-party integration) rather than fabricated
placeholder behavior. Deliberate, stated simplifications (no compatibility-scoring
algorithm, in-application candidate filtering instead of a database index) are documented
as such in code comments and `ARCHITECTURE.md`, not hidden. Deployment target (ECS/Fargate,
single managed container platform) is a considered choice against Kubernetes, not a
default — `backend/k8s/` is explicitly reference-only. **Deduction:** the messaging model's
extra `Conversation` hop and the RBAC join-table structure were undocumented drift from the
original design doc until this pass — architecture *implementation* is strong, architecture
*documentation* had real gaps that are now fixed but shouldn't have existed at a prior
"final verification."

## Security — 8/10

An independent RC-1 re-review (not a rubber-stamp of prior audits) found one Critical
(cross-tenant photo hijack) and one High (missing registration/verification-request rate
limits) finding — both fixed and covered by new regression tests this same pass. Everything
independently re-verified as already correct: argon2id hashing, timing-safe login, refresh
token rotation with reuse detection that revokes the whole session, live per-request
ban/suspend enforcement, Redis-backed distributed rate limiting and account lockout that
fails *closed* (not open) on a Redis outage, hashed-at-rest tokens throughout, IDOR checks
on every "my resource" endpoint, S3 bucket/IAM scoping, properly-scoped CI/CD OIDC
permissions, and Terraform secrets never leaking into a tag/output/resource-name.
**Deductions:** the Critical finding existing at all going into an RC pass is itself
evidence the prior "Phase 2 hardening audit" didn't catch everything it should have; no
column-level encryption exists for PII columns despite `SECURITY_NOTES.md` historically
implying it did; `AuditLog` append-only is enforced at the application layer only, not the
database role level; one Low finding (moderation-case assignee not validated as an actual
moderator) remains open, deferred to keep this pass in Critical/High-only fix scope per
instruction.

## Backend — 9/10

Exceptionally clean for an RC-1: `tsc --noUnusedLocals --noUnusedParameters` returns zero
diagnostics across all 109 source files; every DTO, provider, and environment variable
traces to a real consumer; zero TODO/FIXME/console statements anywhere in `src`; every
implemented endpoint is documented and every documented endpoint exists (verified by direct
diff, not spot-check). The only real findings — duplicated password-validation logic and
three unused devDependencies — were both fixed this pass. Lint: 0 errors. Build: clean.

## Frontend — 6/10

`src/Ember.jsx`/`src/emberApi.js` is a real, working client wired correctly against the
actual backend API (every call verified to match `API.md` exactly, not assumed). **The
scoring deduction is a genuine gap, not a style nit**: the API client has fully-working,
backend-tested `createReport`/`createBlock` functions that no UI screen calls — there is no
way for a user to actually file a report or block someone from inside the app, despite the
app's own marketing copy promising moderated reports. For a dating platform's trust & safety
story, this is a real product gap discovered during this pass, not previously flagged.

## Database — 7.5/10

Well-designed schema: soft-deletes preserve referential integrity for messages/reports,
`Restrict` (not `Cascade`) on report/moderation-case foreign keys deliberately prevents the
trail from being silently erased by a future account-deletion feature, real migrations
tested against a real Postgres instance, sensible indexing on the query patterns that
actually exist. **Deductions:** no column-level encryption for PII columns (disk-level
encryption depends on real RDS infrastructure that doesn't exist yet); no automated
retention/purge for any table (`AuditLog` grows unboundedly); TLS-in-transit to Postgres is
not explicitly configured/verified; `DATABASE_SCHEMA.md` had substantial, security-relevant
drift from the real schema (found and fixed this pass, see `CHANGELOG.md`) — schema.prisma
itself was never wrong, but the documentation of it was, for long enough that it reached an
"RC-1 verification" claiming things were already checked.

## Infrastructure — 6/10

The Terraform module tree itself is thorough and well-reasoned: proper security-group
scoping (each service reachable only by what needs it), encrypted RDS/ElastiCache, a
dedicated least-privilege IAM user for S3 rather than an over-broad role, Secrets Manager
composition with `lifecycle.ignore_changes` so manual post-apply secret edits survive future
applies. **This is infrastructure-as-code complete, and that's the ceiling this category can
score without real verification**: `terraform init/validate/plan/apply` have never run
(this build sandbox's network policy blocks `registry.terraform.io` — documented, not
glossed over), no AWS account exists, and zero real cloud resources have ever been created.
A well-written Terraform module tree that has never been applied is real, valuable work —
it is not infrastructure.

## Operations — 5/10

`OPERATOR_RUNBOOK.md`, `DEPLOYMENT_READINESS_CHECKLIST.md`, and `GO_LIVE_CHECKLIST.md` are
thorough, specific, and consistently apply the four-state framework rather than overclaiming
— genuinely useful documents. **But they are entirely unpracticed**: no backup has ever been
restored, no alarm has ever fired and been acted on, no on-call rotation is named, no
incident has ever been handled using this runbook, because no production system exists yet
to generate any of those events. Written operational readiness and practiced operational
readiness are different things, and only the former exists today.

## CI/CD — 7/10

`backend-ci.yml` gates every push on lint, `npm audit`, build, and the full 90-test suite
against real Postgres/Redis service containers — a real, working gate, not a checkbox.
`backend-deploy.yml`'s deploy step (added Phase 4, re-verified this pass) is a genuine
credential-gated ECS deployment via GitHub OIDC, not a placeholder dressed up to look real —
it correctly reports "not configured yet" rather than silently no-op'ing when the required
secret is absent. **Deduction:** this pipeline has never executed its deploy path against
real infrastructure — code complete and infrastructure-aware by design, zero operational
runs.

## Testing — 7.5/10

90 automated tests (23 unit + 67 e2e, up from 89 this pass), verified this session to
actually pass — not taken on faith — against **real** local PostgreSQL and Redis instances,
not mocks. E2e coverage spans auth, matching, messaging, safety/moderation, photo storage
(against a real local S3-compatible server), observability, and health endpoints.
**Deduction, stated plainly:** the Critical photo-hijack vulnerability existed in code that
had passing tests — the test suite proved the *happy path* worked, not that ownership was
enforced. Two regression tests were added this pass specifically to close that blind spot.
A test suite that reports "89 passing" is evidence of correctness for what it actually
checks, not a substitute for adversarial review of what it doesn't.

## Documentation — 7.5/10

Extensive, cross-referenced, and — after this pass — accurate. The RC-1 documentation
cross-check found and fixed one serious drift (`DATABASE_SCHEMA.md` describing a
vendor-delegated auth model that's the literal opposite of what's built) and several minor
ones (rate-limit numbers, stale deploy-workflow description). **Deduction:** the fact that a
document could claim "no password column" about a schema that has always had one, and
survive multiple prior "final verification" passes, means documentation accuracy was
previously asserted rather than actually checked line-by-line against source. It is
checked now — this report is the evidence of that check having happened.

## Maintainability — 8.5/10

Consistent patterns throughout (the extension-point stub pattern, the four-state readiness
framework, hashed-token-at-rest for every credential-like value), minimal duplication
(one real instance found and fixed this pass), zero dead code, comments that explain *why*
rather than *what*. A new contributor reading this codebase would find very little that
needs archaeology to understand.

## Scalability — 6/10

Explicitly, honestly sized for pre-alpha scale, not enterprise scale — and correctly so for
where this product actually is: `db.t4g.micro`/`cache.t4g.micro`, one Fargate task by
default, in-application (not indexed) candidate filtering, connection-pool sizing not yet
revisited for multi-instance deployment. None of this is a defect for a controlled alpha
cohort; all of it is real work needed before this could handle materially more load, and
that work is honestly deferred rather than silently assumed away.

## Deployment — 5.5/10

A genuinely real, credential-gated automatic deployment path exists in code
(`backend-deploy.yml` → GitHub OIDC → `aws ecs update-service` → health-check validation)
— this is meaningfully further along than a typical RC. **But it has a deployment count of
zero.** No image has ever been deployed to a real environment, no migration has ever run
against a real production database, no health check has ever been validated against a real
URL. The gap between "the pipeline is built correctly" and "the pipeline has deployed
something" is the entire distance between infrastructure-complete and production-ready.

---

## Overall Enterprise Readiness — 6/10

**Strong engineering foundation; effectively zero operational verification.** The code
itself — backend logic, security controls, test coverage, CI gating — is genuinely
close to production quality, and this pass found and closed a real Critical
vulnerability rather than missing it. But "Enterprise Readiness" is not a code-quality
score: it is whether an organization could hand this to real users today, and by that
measure the honest answer is that almost nothing external to the code has been verified —
no AWS account, no vendor account, no domain, no legal review, no on-call, no report/block
UI for real users to actually use. Every one of those gaps is *known and documented*, which
is itself a meaningful signal about the process this project has followed — but a known gap
is still a gap.

---

## GO / NO-GO

# GO WITH CONDITIONS

The codebase is not the blocker. The following four items are, and none of them are
optional even for a small, controlled external alpha:

1. **Real infrastructure must exist and be verified**, not just coded. At minimum:
   `terraform apply` against a real AWS account, `GET /ready` returning 200 against a real
   URL, and one real end-to-end signup→photo-upload→match→message cycle run against it.
   See `DEPLOYMENT_READINESS_CHECKLIST.md` — every row on that list is currently unchecked.
2. **The report/block UI gap must close before real users interact with each other.** A
   dating platform's alpha cohort still needs a working way to report and block, and the
   landing copy already promises one exists. This is a small, bounded UI addition against
   an already-tested backend — not a large feature build.
3. **At minimum a lightweight Terms of Service and Privacy Policy**, reviewed by whoever
   the organization designates for that (counsel or otherwise) — a *controlled* alpha still
   collects real PII (email, DOB, photos, messages) from real people.
4. **A named on-call owner** who has actually read `OPERATOR_RUNBOOK.md` — doesn't need to
   be a rotation for a small alpha, but "nobody" is not an acceptable answer once real user
   data exists in a real database.

Once those four are true, this specific recommendation should be revisited — at that point
the remaining gaps (column-level encryption, retention automation, DB-role-level audit
enforcement, scalability work) are genuinely post-launch-roadmap items, not launch
blockers, for a *controlled, small* alpha specifically. They would become launch blockers
again for a general-availability launch, which is a separate, later decision this report
does not make.
