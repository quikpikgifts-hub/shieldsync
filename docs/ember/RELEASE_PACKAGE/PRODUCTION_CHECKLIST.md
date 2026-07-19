# Ember — Production Checklist (Summary)

Full matrix with evidence citations and owners: `../FINAL_GO_LIVE_MATRIX.md`. This is the
condensed, actionable version.

## Blocking — must be done before any real user is admitted

- [ ] **Real AWS account** with billing active (nothing else on this list can happen
      without this — the critical path).
- [ ] **`terraform apply` executed for real** — VPC, RDS, Redis, S3, Secrets Manager, ECS,
      ALB, all currently code-only.
- [ ] **GitHub OIDC deploy role created** — exact policy documented in `../AWS_SETUP_GUIDE.md` §2.
- [ ] **Container registry pull auth resolved** — make the GHCR package public, or add
      repository credentials to the ECS task definition.
- [ ] **Database migrations run** against the real RDS instance.
- [ ] **Real smoke test passed** — `backend/scripts/launch-verification.mjs` against the
      real deployed URL, not just a clean `terraform apply`.
- [ ] **Report/block UI shipped** in the frontend — backend is ready and tested; no screen
      calls it yet. Safety-critical, not cosmetic, for a dating product.
- [ ] **Terms of Service + Privacy Policy** — at minimum a lightweight, alpha-appropriate
      version, legally reviewed.
- [ ] **Named on-call owner**, who has read `../OPERATOR_RUNBOOK.md` and
      `../OPERATIONS_RUNBOOK.md`.
- [ ] **Real support channel** testers can reach.
- [ ] **Email vendor chosen and configured** (SES, Postmark, or similar) — app degrades
      gracefully without it, but password reset/verification need it.
- [ ] **CloudWatch alarms built** — currently zero exist; logs are collected but nothing
      alerts on them.

## Not blocking for a small controlled alpha, but tracked

- [ ] Multi-AZ RDS/Redis, dedicated KMS key, DNS/TLS on a real domain — reasonable to defer
      at this scale; revisit before general availability.
- [ ] A real RDS snapshot restore drilled (the backup/restore *mechanism* is proven; the
      infrastructure-specific path isn't yet).
- [ ] A real rollback executed at least once against real infrastructure.
- [ ] Formal dependency-license audit, and a `LICENSE` file (currently `UNLICENSED`, no
      file — fine for a closed alpha, worth closing before any wider distribution).

## Already done — real evidence, not assumed

- [x] 90 automated tests passing against real infrastructure (local).
- [x] Independent security re-review — one Critical vulnerability found and fixed.
- [x] Real end-to-end functional validation (42/42 checks) against a real running instance
      (local).
- [x] Real load test — zero errors at load exceeding realistic alpha-scale traffic.
- [x] Real database backup/restore drill — data integrity confirmed intact.
- [x] Terraform reviewed module-by-module, `fmt`-clean.
- [x] All deployment documentation cross-checked against current implementation — zero
      drift found.

## Current recommendation

**NO-GO for launch today.** Not a code-quality verdict — the code is ready. The blocking
items above are external dependencies (an AWS account, a legal review) and one small,
already-scoped piece of frontend work, not open engineering questions. See
`../EXECUTIVE_READINESS_REPORT.md` for the full reasoning and effort estimate.
