# Ember — MVP → Enterprise Roadmap

**Status:** Planning document. Phased so that trust & safety and legal correctness are
front-loaded, and infrastructure complexity (Kubernetes, multi-region, dedicated ML
models) is added only once real usage justifies it — see `ARCHITECTURE.md` §2.

Each phase lists an explicit **gate**: what must be true before moving to the next phase.
Treat gates as blocking, not aspirational — shipping past a gate (e.g. handling payments
before the PCI-scoping decision is made) is how compliance debt accumulates.

---

## Phase 0 — Foundations (before any user data is real)

**Goal:** the legal, policy, and product decisions that shape the schema and architecture,
made *before* they're expensive to change.

- [ ] Engage privacy counsel; decide launch jurisdiction (see `ARCHITECTURE.md` §6 — this
      single decision determines GDPR/UK-GDPR applicability from day one)
- [ ] Decide age-assurance approach (self-attestation vs. ID-based) — this is a legal risk
      decision, not an engineering one, and it changes the signup schema (see R-01 in
      `THREAT_MODEL.md`)
- [ ] Draft ToS, Privacy Policy, Community Standards, Cookie Policy **with counsel**, not
      generated wholesale by an engineer or AI tool
- [ ] Select identity-verification and moderation vendors; complete vendor security review
      (R-10 in `THREAT_MODEL.md`)
- [ ] Decide what the panic/safety features actually do end-to-end (R-04) and get that
      description legally reviewed before any marketing copy references it

**Gate to Phase 1:** the above decisions are made and documented, not deferred "to figure
out during build."

## Phase 1 — MVP

**Goal:** a real, working product for a small closed cohort — replacing the current
client-only prototype with the architecture in `ARCHITECTURE.md` §3.

- [ ] Auth (delegated to Auth0/Clerk), profile creation, photo upload with moderation
      gate before any photo is visible to another user
- [ ] Matching + messaging on the real schema in `DATABASE_SCHEMA.md`
- [ ] Reporting, blocking, and a human moderation queue (no ship without this — it is not
      an optional Phase 2 add-on for a product in this category)
- [ ] Stripe subscriptions via hosted Checkout (Free/Ember+/Gold tiers)
- [ ] Automated data-export and account-deletion workflows (not manual/support-ticket only)
- [ ] Basic phone + email verification (full ID verification can follow in Phase 2 if the
      Phase 0 decision allows a soft launch without it)
- [ ] Responsive web / PWA — no native mobile yet
- [ ] Basic observability (APM + error tracking) from day one

**Gate to Phase 2:** the closed cohort has run long enough to produce real abuse/scam
signal (not zero, not projected) to validate that reporting and moderation actually work
under real conditions, and no unresolved Phase 0 legal item is outstanding.

## Phase 2 — Trust & Safety hardening

**Goal:** the capabilities that specifically distinguish a safety-first platform from a
generic matching app.

- [ ] Government-ID + liveness verification integration (vendor selected in Phase 0)
- [ ] Device fingerprinting + IP reputation + one-account-per-phone enforcement
- [ ] Behavioral fraud/scam scoring (start rules-based; layer ML once there's labeled data)
- [ ] Dedicated moderator tooling: case queue, evidence view scoped to open reports only
      (R-06), appeals workflow
- [ ] Photo-blur-until-match, time-boxed live-location sharing, post-date check-in,
      trusted-contact panic flow — built to the exact spec decided in Phase 0
- [ ] SIEM-style aggregation of audit logs for security review (doesn't require a full
      SIEM product at this scale — start with structured log aggregation + alerting)

**Gate to Phase 3:** moderation queue has a demonstrated SLA (e.g. reports actioned within
24h) under real load, and a third-party security review of Phase 1+2 has been completed.

## Phase 3 — AI features

**Goal:** the AI capabilities layered on top of a platform that already has working safety
rails — not before.

- [ ] Icebreaker generation, compatibility scoring, conversation coaching — clearly labeled
      as AI-assisted to users, never presented as a human recommendation
- [ ] AI-output content filtering (R-09) before anything generated reaches a user
- [ ] Photo/video moderation augmented with automated pre-screening ahead of human review
      (automation reduces reviewer load; it does not replace the human queue from Phase 1)

**Gate to Phase 4:** AI features have run long enough to measure false-positive/negative
rates on moderation-adjacent outputs (toxicity, scam detection) against real cases.

## Phase 4 — Native mobile

**Goal:** React Native apps once the web product and API are stable enough that mobile
isn't chasing a moving backend target.

- [ ] iOS + Android apps sharing logic with the web client where practical
- [ ] Biometric login, secure local storage, push notifications
- [ ] Background sync for messages/safety check-ins

**Gate to Phase 5:** sustained real user growth (not a projection) that specifically
justifies the next phase's infrastructure investment.

## Phase 5 — Scale-out infrastructure

**Goal:** the enterprise infrastructure items deferred since Phase 1, added because load
now actually requires them, not preemptively.

- [ ] Split the modular API service into independent services where a specific one is
      the demonstrated bottleneck (see `ARCHITECTURE.md` §3 rationale)
- [ ] Kubernetes + Terraform-managed infrastructure, if the operational team size justifies
      the added complexity
- [ ] Elasticsearch, if Postgres full-text/trigram search has measurably hit its limit
- [ ] Multi-region deployment, if the user base's geographic distribution requires it
- [ ] SOC 2 Type II audit engagement (this takes months and requires the controls above to
      already be operating consistently — it's the last step, not a parallel-track item)
- [ ] Third-party penetration test, scoped to the full production system

---

## What this roadmap deliberately does not do

It does not promise a delivery date. Phase gates are conditions, not calendar milestones —
a genuinely safety-first dating platform should move to the next phase when the gate is
actually met, not when a schedule says it's time.
