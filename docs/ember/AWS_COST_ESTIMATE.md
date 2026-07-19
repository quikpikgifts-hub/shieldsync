# Ember Backend — AWS Cost Estimate

**These are estimates from AWS's published list pricing (us-east-1, approximate as of this
document's writing) applied to the sizing each tier below describes — not a bill, not a
quote, and not based on any real running infrastructure, since none exists yet.** AWS
pricing changes over time and varies by region; confirm current numbers with the [AWS
Pricing Calculator](https://calculator.aws) before treating any figure here as a budget
commitment. Every component priced below corresponds to an actual resource in
`infra/terraform/` (or a documented gap in `AWS_SETUP_GUIDE.md`) — nothing here is priced
speculatively for infrastructure that isn't part of the actual plan.

## Method

Each tier changes specific Terraform variables (`db_instance_class`, `redis_node_type`,
`ecs_desired_count`, `db_multi_az`, `num_cache_clusters`, `enable_autoscaling`) rather than
describing a different architecture — the same module tree scales across all four tiers.

## Development

**$0/month — not deployed to AWS at all.** This tier is exactly what Phase 5 actually used:
real local PostgreSQL, Redis, and an S3-compatible server on a developer's own machine or a
CI runner, matching the pattern in `TESTING.md`/`docker-compose.yml`. There is no reason to
run a persistent AWS environment just for development — the app's own graceful-degradation
behavior (email/Sentry disabled when unconfigured) makes local-only development fully
functional for everything except real vendor-integration testing.

*If a persistent shared AWS dev environment is wanted anyway* (e.g. for integration testing
against real AWS services before merging), it would use the same sizing as Alpha below,
minus the NAT-gateway redundancy (one NAT gateway instead of two) and DNS
(`enable_dns=false`): roughly **$100-120/month**.

## Alpha (25–100 users) — current Terraform defaults

The sizing `infra/terraform/variables.tf` actually defaults to today: `db.t4g.micro`
single-AZ, `cache.t4g.micro` single-node, one Fargate task (512 CPU units / 1024 MB), two
NAT gateways, one ALB.

| Component | Estimate | Basis |
|---|---|---|
| NAT Gateways (×2) | ~$66/mo | $0.045/hr × 730hr × 2, + minimal data processing at this traffic level |
| RDS (`db.t4g.micro`, single-AZ) | ~$15-18/mo | ~$0.016/hr instance + 20GB gp3 storage + 7-day backup storage |
| ElastiCache (`cache.t4g.micro`, single node) | ~$12/mo | ~$0.016/hr |
| Fargate (1 task, 0.5 vCPU / 1GB) | ~$18/mo | ~$0.0247/hr combined vCPU+memory rate |
| ALB | ~$18-21/mo | ~$0.0225/hr base + minimal LCU usage at this traffic level |
| S3 (photos) | ~$2-5/mo | Storage + requests at alpha-cohort photo volume |
| Secrets Manager (1 secret) | ~$1/mo | $0.40/secret + minimal API-call volume |
| CloudWatch Logs | ~$3-5/mo | Ingestion + 30-day retention at this log volume |
| Route53 (if `enable_dns=true`) | ~$1/mo | $0.50/hosted zone + minimal query volume |
| Data transfer out | ~$1-2/mo | Alpha-scale photo/API traffic |
| **Total** | **~$135-165/mo** | |

**Cost-saving option**: dropping to one NAT gateway (`AWS_SETUP_GUIDE.md`'s networking
module supports this only via a manual Terraform edit — it's currently hardcoded to one per
AZ, see `TERRAFORM_READINESS.md`) saves roughly $33/month at the cost of the
outbound-traffic redundancy described in `modules/networking/main.tf`'s own comment —
reasonable to accept for a 25-100 person alpha, not recommended once real user trust is on
the line.

*(Note: this corrects an internal inconsistency in `infra/terraform/README.md`'s original
Phase 4 estimate, which summed its own listed component ranges to a number exceeding its
stated $50-120/month total — a simple addition error in that document, not a re-pricing.
See that file for the update.)*

## Beta (a few hundred to low thousands of users)

Multi-AZ RDS, Redis with automatic failover, ECS autoscaling turned on. Concretely:
`db_multi_az=true`, `num_cache_clusters=2`, `enable_autoscaling=true` with
`ecs_desired_count=2` as the autoscaling floor, `db_instance_class`/`redis_node_type`
raised one tier (e.g. `db.t4g.small`/`cache.t4g.small`).

| Component | Estimate | Basis |
|---|---|---|
| NAT Gateways (×2) | ~$70-90/mo | Same base cost, more data processing at higher traffic |
| RDS (`db.t4g.small`, Multi-AZ) | ~$60-70/mo | Multi-AZ roughly doubles the single-instance rate, plus a larger instance class |
| ElastiCache (`cache.t4g.small` ×2, failover) | ~$50-60/mo | Two nodes instead of one, one tier larger |
| Fargate (2-3 tasks avg, autoscaling) | ~$40-60/mo | Scales with `ecs_desired_count`/autoscaling activity |
| ALB | ~$25-35/mo | Higher LCU usage at this traffic level |
| S3 | ~$10-20/mo | More photos, more requests |
| Secrets Manager | ~$1/mo | Unchanged |
| CloudWatch Logs + Alarms | ~$10-15/mo | Higher log volume, plus the alarms this tier should have added (see `TERRAFORM_READINESS.md`'s Monitoring gap) |
| Route53 | ~$1/mo | Unchanged |
| Data transfer out | ~$10-25/mo | Meaningfully more photo/API traffic |
| **Total** | **~$280-380/mo** | |

## Production (general availability scale)

Wide range, since "production scale" isn't a fixed number — this assumes a low-to-mid-tens-
of-thousands active user range, not hyperscale. Adds: a read replica for RDS, larger
ElastiCache cluster, ECS autoscaling with a higher ceiling, and likely a WAF in front of the
ALB (not currently in `infra/terraform/` — a real gap for this tier specifically, since WAF
matters much more at real internet-facing scale than at alpha scale).

| Component | Estimate | Basis |
|---|---|---|
| NAT Gateways (×2) | ~$100-150/mo | Higher data processing volume |
| RDS (`db.r6g.large` + 1 read replica, Multi-AZ) | ~$400-600/mo | Larger instance class, Multi-AZ, plus a full second instance for the replica |
| ElastiCache (larger cluster, 3+ nodes) | ~$200-350/mo | Larger node type, more nodes |
| Fargate (4-8 tasks avg, autoscaling) | ~$150-350/mo | Scales with real traffic and autoscaling policy |
| ALB | ~$60-120/mo | Meaningfully higher LCU usage |
| WAF (not yet in Terraform — see note above) | ~$15-30/mo | Base WAF charge + rule evaluations, if added |
| S3 | ~$50-150/mo | Real-scale photo storage + requests |
| Secrets Manager | ~$1-3/mo | Possibly more secrets if the architecture grows |
| CloudWatch Logs + Alarms + Dashboards | ~$50-100/mo | Real production log volume |
| Route53 | ~$1-5/mo | Higher query volume |
| Data transfer out | ~$100-300/mo | Real-scale traffic |
| **Total** | **~$1,100-2,000+/mo** | Wide range — real usage data is the only way to narrow this |

## What isn't priced above

- **Payments processing** (Stripe fees) — not applicable; no payment provider is wired
  (`ROADMAP.md`).
- **A CDN** — not used by this architecture (see `AWS_SETUP_GUIDE.md` §11); would add cost
  only if added later.
- **Support plan** — AWS Business/Enterprise support tiers are a percentage-of-spend
  add-on, not included above; worth budgeting once spend and uptime requirements justify
  it.
- **Domain registration** itself (Route53 or a third-party registrar) — typically
  $12-15/year, negligible relative to the rest, and a one-time-ish annual cost rather than
  monthly infrastructure spend.

## Recommendation

Do not commit to a budget number from this document alone. Use it to set an *order-of-
magnitude* expectation (roughly $150/month for the alpha this project is actually preparing
for, scaling from there), then validate the Alpha tier's real number against an actual first
month's AWS bill once real infrastructure exists — that real number, not this estimate,
should drive Beta/Production budget planning.
