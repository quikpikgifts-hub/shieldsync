# Ember Backend — Load Test Report (Phase 5)

**These are real, measured numbers — every figure below came from `autocannon` runs
against a genuinely running instance of this backend, not an estimate.** They were
measured against this session's local sandbox (real PostgreSQL 16, real Redis 7, real
S3-compatible object storage, the compiled app running in `NODE_ENV=production`), **not
against real deployed AWS infrastructure** — no AWS account/credentials exist this session
(see `PRODUCTION_READINESS_REPORT.md`). Treat these as evidence that the application has no
obvious pathological bottleneck and behaves correctly under concurrency, not as a real
production capacity number — the sandbox host's CPU/memory/network characteristics are not
the same as the `db.t4g.micro`/single-Fargate-task sizing `infra/terraform/variables.tf`
actually specifies for a real deployment, and there is no real network hop (ALB, NAT,
RDS/ElastiCache over the wire) in any of this.

## Method

- App built and run exactly as it would be in production (`nest build && node
  dist/src/main.js`, `NODE_ENV=production`), against real local Postgres/Redis/S3-compatible
  storage — the same setup used for the RC-1 and Phase 5 functional validation passes.
- Load generated with `autocannon` (industry-standard Node HTTP load tool) from the same
  host — no network latency between load generator and server, which real production
  traffic will have (via a real ALB) and this test does not.
- Global and per-route throttle limits were raised for the *capacity* runs specifically
  (documented per-run below) so the measurement reflects application/database throughput
  rather than the rate limiter — the rate limiter's own correctness under concurrent load
  was verified separately, at its real configured value, first.
- CPU/memory sampled once per second via `ps` against the Node process; Postgres connection
  count sampled via `pg_stat_activity` during the authenticated-load runs.

## Rate limiter correctness under concurrency (real default config, not raised)

20 concurrent `POST /auth/login` requests fired at once against the default 5/min-per-IP
limit: the atomic Lua-scripted Redis throttle (`RedisThrottlerStorage`) correctly rejected
every request beyond the remaining budget with `429` — no race condition let more requests
through than the configured limit, confirming the fix from `SECURITY_AUDIT.md` H-3 holds
under real concurrent load, not just sequential calls. (Only 1 of the 20 succeeded rather
than 5, because prior test traffic in this same 60-second window against the same IP had
already consumed most of the budget — expected behavior for a limiter that's correctly
shared/persistent across calls, not a bug.)

## Throughput and latency (throttle limits raised for these runs only)

| Route | Auth | Concurrency | Duration | Req/sec (avg) | Latency avg | p50 | p90 | p99 | max | Errors |
|---|---|---|---|---|---|---|---|---|---|---|
| `GET /live` | none | 20 | 15s | 2,615 | 7.2ms | 6ms | — | 15ms | 38ms | 0 / 39,224 |
| `GET /profiles/me` | JWT | 50 | 20s | 1,039 | 47.7ms | 45ms | 55ms | 92ms | 114ms | 0 / 20,775 |
| `GET /matching/candidates` | JWT | 50 | 20s | 449 | 110.6ms | 109ms | 134ms | 174ms | 362ms | 0 / 8,973 |
| `GET /matching/candidates` (45s soak) | JWT | 30 | 45s | 466 | 63.9ms | 63ms | — | 93ms | 124ms | 0 / 20,961 |

**Zero errors, zero timeouts, zero non-2xx responses across every run.** `/matching/candidates`
is the slowest and most expensive route tested — expected, since `MatchingService.listCandidates()`
runs three queries (preferences, decided-likes, blocks) plus a 200-row candidate-pool fetch
per request, and (per its own documented design, see `DATABASE_SCHEMA.md` §4) filters age
in application code rather than via an indexed predicate. `/profiles/me` and `/live` are
correspondingly faster, single-query or no-query paths.

## Resource usage under load

- **CPU**: the single Node process saturated to ~100-130% (one core fully busy, plus some
  scheduling overhead) under 30-50 concurrent connections against the DB-heavy candidates
  endpoint. This is expected for Node's single-threaded event loop — it means one process
  instance's ceiling under this workload shape is around the throughput measured above, not
  that something is wrong; horizontal scaling (raising `ecs_desired_count`, off by default
  — see `infra/terraform/variables.tf`) is the documented path past this ceiling, not a code
  fix.
- **Memory**: RSS grew from a ~155MB baseline to ~340-355MB over the first ~20 seconds of
  sustained load, then **plateaued** for the remainder of a 45-second soak test rather than
  continuing to climb — a real, measured signal against an unbounded leak, though a
  45-second window is far too short to fully rule out a slow leak under real production
  duration (hours/days). A longer soak (hours, ideally against real infrastructure with
  real monitoring — see `DEPLOYMENT_READINESS_CHECKLIST.md`'s Monitoring section) is a
  fair pre-launch ask, not yet performed.
- **Database connections**: held steady at exactly 10 throughout every authenticated load
  run (`pg_stat_activity`), matching Prisma's default connection pool size — no pool
  exhaustion observed at 30-50 concurrent application-level requests. `PRODUCTION_READINESS.md`'s
  existing note about revisiting pool sizing before raising `ecs_desired_count` past 1 is
  unaffected by this result (that's about multi-instance pool math, not single-instance
  behavior, which is what was tested here).
- **Redis**: no errors, no connection issues, correctly backing both the throttle and (in
  the separate Phase 5 functional-validation run) the account-lockout/token-blacklist paths
  under real concurrent traffic.

## What this does and doesn't tell you

**Does tell you:** the application has no obvious pathological bottleneck (no error surge,
no timeout cliff, no connection-pool collapse) at load levels far exceeding what a 25-100
person controlled alpha will realistically generate — even the slowest route sustained
hundreds of requests/second with sub-200ms p99 latency and zero errors. The rate limiter
correctly holds under real concurrent bursts, not just sequential test calls.

**Doesn't tell you:** real production capacity. This ran on unconstrained sandbox hardware
against localhost, not the `db.t4g.micro`/single-Fargate-task-at-512-CPU-units sizing the
real Terraform config specifies, and with none of the network overhead a real ALB → ECS →
RDS/ElastiCache path adds. **A real load test against real deployed infrastructure, sized
and configured as Terraform actually specifies, has not been performed and is a genuine
open item** before any claim of production capacity — see `PRODUCTION_READINESS_REPORT.md`.

## Recommendation

No load-related code changes are indicated by this data — the application handled
sustained concurrent load cleanly at every tier tested. The two real open items are
operational, not code: (1) a longer memory soak test once real infrastructure exists, to
fully rule out a slow leak beyond the 45-second window tested here, and (2) a real load
test against real deployed infrastructure before scaling this cohort meaningfully past the
alpha's 25-100 target, since the actual `db.t4g.micro`/single-task sizing has never been
measured under load.
