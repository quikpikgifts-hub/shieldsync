# Ember — System Architecture

**Status:** Partially built. Phase 1 (auth, RBAC, profiles, matching, messaging, safety
foundation) is implemented in `backend/` and covered by real tests against a real
PostgreSQL database — see `CHANGELOG.md`, `TESTING.md`, and `OPEN_DECISIONS.md` for what's
real versus still planned. Sections below marked "target state" describe what's still
ahead; §1a describes what actually exists today.

**Not legal or security certification.** This document informs engineering decisions. It
does not substitute for review by qualified privacy counsel, a licensed security auditor,
or a PCI-DSS QSA before real user data, payments, or safety-critical features go live.

---

## 1. Current state (frontend)

- One React component (`src/Ember.jsx`), path-routed at `/ember` inside a Vite SPA that
  also serves two unrelated static sites (`src/App.jsx`, `src/Website.jsx`) from the same
  deployment.
- All data is hardcoded in-file (`MATCHES`, `LIKES`, etc.) and all mutations are local
  React state. Refreshing the page resets everything. **The frontend is not yet wired up
  to the backend described below** — that integration hasn't been built.

## 1a. Current state (backend — as of Phase 1)

`backend/` is a real NestJS + PostgreSQL + Prisma service, run and tested locally:

- Authentication, RBAC, Profiles, Matching, Messaging, and the full Safety foundation
  (Reports, Blocks, ModerationCases, append-only AuditLog) are implemented and tested
  (39 passing tests — 10 unit, 29 e2e — against a real local Postgres instance).
- **Divergence from the plan below:** §3's stack table recommends delegating auth to
  Auth0/Clerk. Phase 1 instead built a real self-hosted JWT/Argon2id auth system, because
  no vendor credentials exist in this environment and the instruction was explicit: no
  mock auth, everything must execute locally. See `OPEN_DECISIONS.md` D-01 for the full
  rationale and what would need to be true to migrate to a managed provider later.
- Every third-party integration named below (Stripe, Twilio, AWS S3, identity
  verification, OpenAI/Anthropic, push, email, analytics) exists only as an interface +
  DI token + an adapter that throws a clear "not configured" error — see
  `backend/src/integrations/README.md`. None are operational.
- Kubernetes/Terraform/Elasticsearch/multi-region remain deferred per §2 below — nothing
  in Phase 1 needed them, and standing them up now would be exactly the premature
  complexity this document argues against.

Every section below is a proposal to replace this with something real, phased so that each
step is buildable and verifiable rather than a leap to full enterprise scale on day one.

## 2. Design principle: don't build for a scale you don't have yet

The brief that prompted this document asks for Kubernetes, Elasticsearch, multi-service
NestJS, and Terraform-managed infrastructure from the start. That's the right stack
*eventually*, but standing up a Kubernetes cluster for zero production users is a common
and expensive architecture mistake — it adds operational surface area (more things to
secure, patch, and monitor) without adding capability. The phasing below front-loads
**safety and privacy correctness** (identity, consent, data minimization, moderation) and
defers **infrastructure complexity** until real load justifies it.

## 3. Target architecture — Phase 1 (MVP)

```mermaid
flowchart LR
    subgraph Clients
        Web[Next.js Web App]
        Mobile[React Native App]
    end

    subgraph Edge
        CDN[CDN / Static Assets]
        WAF[WAF + Rate Limiting]
    end

    subgraph API["API Layer (single service, modular)"]
        Auth[Auth Module]
        Profiles[Profile Module]
        Matching[Matching Module]
        Messaging[Messaging Module]
        Safety[Safety & Reporting Module]
        Billing[Billing Module]
    end

    subgraph Data
        PG[(PostgreSQL — primary datastore)]
        Redis[(Redis — sessions, rate limits, queues)]
        S3[(Object storage — photos/video/voice)]
    end

    subgraph ThirdParty["Third-party services (vendor, not built in-house)"]
        IdV[Identity verification vendor]
        Stripe[Stripe — billing]
        Twilio[Twilio — SMS/phone verification]
        Moderation[Image/video moderation vendor]
        LLM[LLM provider — icebreakers, coaching]
    end

    Web --> CDN --> WAF --> API
    Mobile --> WAF
    Auth --> PG
    Auth --> Redis
    Profiles --> PG
    Profiles --> S3
    Matching --> PG
    Matching --> Redis
    Messaging --> PG
    Messaging --> Redis
    Safety --> PG
    Billing --> PG
    Billing --> Stripe
    Auth --> Twilio
    Profiles --> IdV
    Profiles --> Moderation
    Matching --> LLM
    Messaging --> LLM
```

**Why a single modular API service, not microservices, at this phase:** with zero real
users, splitting into a dozen NestJS services means a dozen things to deploy, monitor, and
secure independently, for no throughput benefit. A single well-modularized service
(Auth / Profiles / Matching / Messaging / Safety / Billing as separate NestJS modules
inside one deployable) gets the same code organization with a tenth of the operational
burden. Split modules into independent services only when a specific one becomes a
scaling or team-ownership bottleneck — not preemptively.

### Stack (Phase 1)

| Layer | Choice | Notes |
|---|---|---|
| Web | Next.js + TypeScript | SSR for SEO on public profile/landing pages, matches existing team stack |
| Mobile | React Native / Expo | Shared logic with web where practical |
| API | Node.js + NestJS (single service, modular) | Modules map 1:1 to the domains above |
| Primary DB | PostgreSQL (managed — RDS or equivalent) | See `DATABASE_SCHEMA.md` |
| Cache / queues | Redis (managed) | Sessions, rate limiting, background job queue |
| Object storage | S3 (or equivalent) | Photos, video intros, voice notes — never in Postgres |
| Auth | Managed provider (Auth0 / Clerk) rather than hand-rolled | Identity is the single highest-consequence thing to get wrong; don't build it in-house at MVP |
| Payments | Stripe, using Stripe-hosted Checkout/Elements | Keeps raw card data off our servers entirely (PCI SAQ-A scope, not SAQ-D) |
| Phone/SMS | Twilio | Phone verification, safety alerts |
| Identity verification | Dedicated vendor (e.g. Persona, Onfido, Stripe Identity) | Government-ID + liveness is a regulated, high-stakes capability — buy, don't build |
| Infra | Single managed container platform (e.g. AWS ECS/Fargate, or Vercel + a managed API host) | Defers Kubernetes until there's a concrete scaling reason |
| CI/CD | GitHub Actions | Matches existing repo tooling |
| Observability | Managed APM (e.g. Datadog) from day one, even at small scale | Cheap insurance; retrofit is painful |

### Deferred to later phases (see `ROADMAP.md`)

- Kubernetes / Terraform-managed multi-service infrastructure
- Elasticsearch (Postgres full-text + trigram search covers MVP search needs)
- Multi-region deployment
- In-house fraud/bot-scoring model (start with a vendor or a simple rules engine)
- Native mobile (Phase 1 ships responsive web / PWA first)

## 4. Security architecture (Phase 1 baseline — non-negotiable regardless of scale)

- **Transport:** TLS 1.3 everywhere; HSTS; no plaintext fallback.
- **At rest:** Database and object storage encrypted at rest (cloud-provider managed keys
  at MVP; customer-managed keys is a Phase 3+ enterprise item, not a blocker for launch).
- **Passwords:** Delegated to the auth provider (Auth0/Clerk), which handles Argon2id/bcrypt
  hashing — do not hand-roll credential storage.
- **Sessions:** Short-lived JWT access tokens + rotating refresh tokens, revocable server-side.
- **Authorization:** RBAC at the API layer (`user`, `moderator`, `admin`, `support`), enforced
  in a single shared middleware, not per-endpoint ad hoc checks.
- **Secrets:** A managed secrets store (e.g. AWS Secrets Manager / Vercel encrypted env vars),
  never committed to the repo, never in client bundles.
- **API layer:** WAF + rate limiting in front of every endpoint; stricter limits on
  auth, messaging, and reporting endpoints specifically (the ones scammers and bots hit hardest).
- **Input handling:** Parameterized queries only (NestJS + an ORM like Prisma/TypeORM by
  default prevents raw SQL injection — enforce via lint rule, don't rely on discipline).
- **Headers:** CSP, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` on every response.
- **Audit logging:** Every access to another user's PII, every moderation action, every
  admin action — who, what, when, from where — append-only, not editable by the actor.

## 5. Privacy architecture (Phase 1 baseline)

- **Data minimization:** Collect the minimum needed per feature. Government ID goes to the
  verification vendor, not into our database — we store a verification *result* (pass/fail
  + timestamp + vendor reference ID), never the ID image or number.
- **Consent:** Explicit, logged, timestamped consent for each processing purpose that needs
  it (marketing SMS/email, location sharing, background-check add-on). Consent state is
  queryable per user, not inferred from a single "I agree" checkbox.
- **Retention:** A written retention schedule per data category (see `COMPLIANCE_CHECKLIST.md`)
  with an automated job that enforces it — not a policy that only lives in a document.
- **Right to access / erasure:** A real, automated data-export and account-deletion workflow
  from day one — retrofitting this after launch is far more expensive than building it in.
- **Location:** Precise location is never stored longer than the feature requires it
  (e.g. "Nearby now" visibility window); city-level location is what's shown to other users,
  not exact coordinates.

## 6. Open architectural decisions requiring sign-off before Phase 1 build starts

1. **Launch jurisdiction scope.** Launching US-only first materially reduces compliance
   scope (no GDPR data-transfer mechanics) vs. launching in the EU/UK simultaneously.
   This is a product/legal decision, not an engineering one — make it before schema design,
   since it affects what consent and data-residency fields the schema needs.
2. **Identity verification vendor.** Which vendor, and what the actual bar is (ID + liveness
   only vs. ID + liveness + background-check add-on) affects the `verifications` table shape
   and the cost model.
3. **Age assurance approach.** A dating platform's obligation is to keep minors *off* the
   platform entirely (18+), not to "protect minors" as participants — confirm the intended
   age-gating mechanism (self-attestation vs. ID-based) before building signup.
