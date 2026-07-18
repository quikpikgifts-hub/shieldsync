# Ember Backend — Go-Live Checklist

This is the pre-launch verification pass. `DEPLOYMENT_READINESS_CHECKLIST.md` is the
worklist for *getting* every external dependency provisioned; this document is what gets
checked, in order, immediately before real users are let in.

## The four states — used consistently below, don't collapse them

- **Code complete** — the application code exists, compiles, and is covered by tests that
  pass against real local infrastructure (real Postgres, real Redis, a real local
  SMTP/S3-compatible server). Proves the logic is correct. Says nothing about whether a
  real production instance of anything exists.
- **Infrastructure complete** — the Terraform/config/manifests describing the real
  resource exist and have been reviewed (see `infra/terraform/README.md` for exactly what
  review means here — `fmt` + manual read, `init`/`validate`/`plan` blocked by this
  session's network policy). Says nothing about whether `apply` has actually been run.
- **Operationally verified** — the real resource exists (Terraform applied, account
  created, DNS resolving, etc.) *and* a specific, stated check against the real thing has
  been run and passed. This is evidence, not confidence.
- **Production ready** — operationally verified, *and* it's been true under realistic
  conditions for long enough to trust (e.g., a backup restore drill has actually been
  performed, not just "backups are enabled"; an alert has actually fired and been acted on
  in a drill, not just "an alarm resource exists").

**Nothing in this document may be marked "production ready" on the strength of the code
existing.** Every checkbox below states what evidence satisfies it.

---

## Infrastructure

- [ ] AWS account provisioned, billing active — **operationally verified** requires `aws
      sts get-caller-identity` to succeed against a real account.
- [ ] `terraform apply` completed against `infra/terraform/` with zero errors —
      **infrastructure complete** today (code exists, `fmt`-clean, manually reviewed);
      **operationally verified** requires a real `apply` run, which requires an environment
      where `registry.terraform.io` isn't blocked (this build sandbox's network policy
      blocks it — see `infra/terraform/README.md`).
- [ ] ECS service running with `desired_count` healthy tasks — **operationally verified**
      requires `aws ecs describe-services` to show `runningCount == desiredCount`.
- [ ] Container image published to GHCR by `backend-deploy.yml` — **code complete** (the
      workflow exists and is `fmt`/syntax-valid); **operationally verified** requires the
      workflow to have actually run and produced a real image tag.

## Security

- [ ] `JWT_ACCESS_SECRET` is a real random 32+ character value, not the CI/dev placeholder
      — **operationally verified** requires reading the real Secrets Manager value (or
      confirming Terraform generated it — `modules/secrets` does this automatically) and
      confirming it differs from every value in `.env`/`.env.test`/`backend-ci.yml`.
- [ ] No secret is baked into the Docker image or committed to the repo — **code
      complete**: `Dockerfile` never `COPY`s an env file; `.gitignore` excludes
      `*.tfvars`/`.env*` (except `.example`s). **Operationally verified** requires
      `docker history <image>` showing no secret-bearing layer and a repo-history grep
      confirming no real secret was ever committed.
- [ ] Security groups restrict database/cache access to the application only —
      **infrastructure complete** (`modules/networking`'s security groups are scoped this
      way by construction); **operationally verified** requires `aws ec2
      describe-security-groups` against the real groups confirming no `0.0.0.0/0` ingress
      rule exists on the database/cache security groups.
- [ ] `npm audit --omit=dev --audit-level=high` passes — **operationally verified today**:
      run in CI on every push (`backend-ci.yml`), currently 0 vulnerabilities.
- [ ] Full security audit findings closed or explicitly accepted — see
      `SECURITY_AUDIT.md`'s summary table; every Critical/High is Fixed, remaining
      Low/Informational items are documented, not silently ignored.

## Monitoring

- [ ] `/health`, `/ready`, `/live` respond correctly against the real deployment —
      **operationally verified** requires `curl`ing the real ALB/domain and confirming
      `details.database.status` and (if Redis is configured) `details.redis.status` are
      both `"up"`.
- [ ] `/metrics` is being scraped by something — **infrastructure complete** (the endpoint
      exists and is tested — `test/observability.e2e-spec.ts`); **operationally verified**
      requires a real Prometheus/CloudWatch-agent/equivalent actually pulling from it, not
      just the endpoint existing unused.
- [ ] Sentry receives a real test exception — **operationally verified** requires
      deliberately triggering one against the real deployment and confirming it appears in
      the Sentry dashboard within 5 minutes.
- [ ] CloudWatch alarms exist and are wired to a real notification channel — see
      `DEPLOYMENT_READINESS_CHECKLIST.md`'s Monitoring section; **production ready**
      requires at least one alarm to have been deliberately tested (force the condition in
      a non-production environment, confirm the notification arrives).

## Backups

- [ ] RDS automated backups enabled, retention ≥ 7 days — **infrastructure complete**
      (`modules/database` configures this); **operationally verified** requires `aws rds
      describe-db-instances` against the real instance.
- [ ] A restore has actually been performed — **production ready** requires this, not just
      "backups are enabled." See `RELEASE.md`'s rollback runbook and
      `DEPLOYMENT_READINESS_CHECKLIST.md`'s restore-drill row. Backups nobody has ever
      restored from are unverified, not ready.

## Disaster recovery

- [ ] RTO/RPO targets are written down — **not started**. No number has been proposed in
      this project's documentation yet; this needs a business decision (how much data loss
      / downtime is acceptable) before it can be an engineering target.
- [ ] Multi-AZ enabled for RDS/Redis if the RTO target requires it — currently `false` by
      default (`db_multi_az`/`num_cache_clusters` in `infra/terraform/variables.tf`) —
      appropriate for a pre-alpha cohort's cost profile, revisit once an RTO exists.
- [ ] Rollback procedure tested end-to-end — **operationally verified** requires actually
      running the `workflow_dispatch` rollback path in `RELEASE.md` against a real
      (non-production, ideally) environment at least once before relying on it during a
      real incident.

## Email

- [ ] Real SMTP credentials configured — see `DEPLOYMENT_READINESS_CHECKLIST.md`'s Email
      section for the full vendor-selection/verification chain. **Code complete** today
      (the adapter is real and tested against a real local SMTP server —
      `smtp-email.provider.spec.ts`); **operationally verified** requires an actual email
      landing in a real inbox from the real deployment.
- [ ] Verification and password-reset emails both spot-checked against real inboxes
      (Gmail, Outlook, one other) — not in spam, links work, correct content.

## Storage

- [ ] Real S3 bucket provisioned and reachable — see
      `DEPLOYMENT_READINESS_CHECKLIST.md`'s Object Storage section. **Code complete**
      today (verified against a real local S3-compatible server —
      `s3-storage.provider.spec.ts`, `test/photo-storage.e2e-spec.ts`); **operationally
      verified** requires a real upload → register → signed-read round trip against the
      real bucket.
- [ ] Thumbnail generation confirmed working against real storage — a registered photo
      produces a non-null `thumbnailUrl` within a reasonable time window.

## Payments

- [ ] **Not applicable to this launch.** No payment provider adapter is built
      (`PaymentProvider` remains `NotConfiguredPaymentProvider`) — correctly out of scope
      per `ROADMAP.md`. Listed here so its absence is a documented decision, not a gap
      discovered during launch.

## Domain / DNS

- [ ] Domain owned by the organization (not an individual) — verify via registrar account
      access, not just "someone has the login."
- [ ] DNS resolving to the real ALB — **operationally verified** requires `dig
      <api-domain>` returning the ALB's address and `curl` against it succeeding.

## SSL/TLS

- [ ] ACM certificate issued and validated — **operationally verified** requires `aws acm
      describe-certificate` showing `ISSUED` against the real certificate.
- [ ] HTTPS enforced (HTTP redirects to HTTPS) — **infrastructure complete**
      (`modules/ecs`'s HTTP listener redirects once `acm_certificate_arn` is set);
      **operationally verified** requires `curl -I http://<domain>` showing a 301 to
      `https://`.
- [ ] TLS certificate covers the real domain with no browser warnings — manual check in a
      real browser against the real URL.

## Legal documents

- [ ] Terms of Service — **not started**. Requires counsel; see
      `DEPLOYMENT_READINESS_CHECKLIST.md`'s Legal & Compliance section. Not an engineering
      deliverable and not produced by this pass.
- [ ] Community Standards / acceptable-use policy — **not started**, same reasoning.

## Privacy policy

- [ ] Privacy Policy — **not started**, same reasoning as Terms of Service. Must
      accurately describe what this backend's code actually does (see `SECURITY_NOTES.md`
      and `ARCHITECTURE.md` §5 for the real data-handling behavior it needs to describe
      accurately) — write it *from* the real system's behavior, not before the system
      exists to describe.

## Terms of Service

- [ ] See "Legal documents" above — listed separately here only because the requested
      checklist structure calls it out individually; it's the same not-started item.

## Incident response

- [ ] A named on-call owner or rotation exists — **not started**. See
      `DEPLOYMENT_READINESS_CHECKLIST.md`'s Incident Response section.
- [ ] `OPERATOR_RUNBOOK.md` has been read by whoever is on call — a process check, not a
      technical one; verify by asking them, not by assuming.
- [ ] A paging/alerting channel is connected to the CloudWatch alarms above — **production
      ready** requires this to have been tested with a real (drilled) alarm firing.

## Support process

- [ ] A monitored support channel/inbox exists — **not started**. See
      `DEPLOYMENT_READINESS_CHECKLIST.md`.
- [ ] A moderator/admin account exists in the real production database with real
      permissions — **operationally verified** requires actually granting the `moderator`
      or `admin` role to a real account against the real database (see `OPEN_DECISIONS.md`
      D-03 — there's no self-service admin-grant endpoint by design; this is a direct
      database operation during initial setup).

## Launch verification

The final pass, run in order, against the real production URL, immediately before
announcing availability to real users:

1. [ ] `GET /live` → 200.
2. [ ] `GET /ready` → 200, `details.database.status == "up"` (and `details.redis.status ==
       "up"` if Redis is configured).
3. [ ] `GET /health` → 200, memory checks `"up"`.
4. [ ] Register a real test account through the real API against the real domain.
5. [ ] Confirm the verification email arrives in a real inbox and the link works.
6. [ ] Create a profile, upload a real photo, confirm it's retrievable via its signed URL
       and a thumbnail is generated.
7. [ ] Register a second real test account, produce a mutual like, confirm a match and
       message send/receive both work.
8. [ ] File a report from one test account against the other; confirm it's visible to a
       real `moderator`-permissioned account and resolvable.
9. [ ] Trigger a password reset for the first test account; confirm the email arrives, the
       reset works, and the account's other sessions are actually revoked (a previously
       issued access token now fails).
10. [ ] Confirm `GET /metrics` is reachable by the monitoring system, not just by hand.
11. [ ] Confirm a deliberately-triggered error appears in Sentry within 5 minutes.
12. [ ] Delete both test accounts' data by hand (or via whatever the real cleanup process
        is) — real test data must not linger in the production database post-launch.

**Every box in this section must be individually checked, with the person and timestamp
who checked it recorded somewhere durable (a launch-day log, not just memory) — this is
the one section of this document that should never be marked complete based on "it should
work."**
