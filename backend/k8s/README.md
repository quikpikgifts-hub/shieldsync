# Kubernetes manifests — reference only, not a recommendation to adopt K8s now

`docs/ember/ARCHITECTURE.md` §2–3 and `docs/ember/ROADMAP.md` Phase 5 are explicit: standing
up Kubernetes before real load justifies it is exactly the premature infrastructure
complexity this project has deliberately avoided so far, and `DEPLOYMENT.md` recommends a
single managed container platform (ECS/Fargate or equivalent) over K8s for the same reason.

These manifests exist because Phase 3's brief asked for them ("optional if appropriate"),
not because this project is recommending a move to Kubernetes. Treat them as **a portability
reference** — proof the app is container-orchestration-agnostic and a starting point if/when
`ROADMAP.md`'s Phase 5 gate ("sustained real user growth that specifically justifies the next
phase's infrastructure investment") is actually met — not as this project's advised path.

## What's here

- `configmap.yaml` — non-secret configuration (matches `.env.example`'s non-secret vars).
- `secret.example.yaml` — the **shape** of the Secret object this deployment expects.
  **Never apply this file as-is** — it contains placeholder values, not real secrets. Real
  secrets belong in whatever secrets mechanism the target cluster uses (Sealed Secrets,
  External Secrets Operator pulling from a cloud secrets manager, SOPS, etc.) — this
  repository intentionally does not choose one, since that's a platform-team decision.
- `deployment.yaml` — a single Deployment, `replicas: 1` by default (see the note in
  `docker-compose.prod.yml` about what changes once this is raised — the Redis-backed
  throttler storage already handles it correctly, but connection-pool sizing does not
  scale itself), with liveness/readiness probes pointed at `/live` and `/ready`
  (`src/health/health.controller.ts`).
- `service.yaml` — a ClusterIP Service in front of the Deployment.
- `hpa.yaml` — a HorizontalPodAutoscaler, **not wired to anything by default** (commented
  out in spirit — see the file's own header) since autoscaling policy is exactly the kind
  of premature-optimization decision `ARCHITECTURE.md` §2 warns against making before
  there's real traffic data to base it on.

## What's deliberately not here

Postgres and Redis themselves — a real deployment should use managed services (RDS/Cloud
SQL, ElastiCache/Memorystore) rather than self-hosting stateful services inside the same
cluster, for the same reason `ARCHITECTURE.md` §3's stack table recommends managed Postgres.
No Ingress/TLS-termination manifest either — that's specific to whichever ingress controller
and certificate-management approach (cert-manager, cloud load balancer, etc.) the target
cluster already uses, and inventing one here would be guessing at infrastructure this
project has no visibility into.
