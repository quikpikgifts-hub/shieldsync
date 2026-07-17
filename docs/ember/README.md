# Ember — Planning & Engineering Documents

`backend/` is a real, running NestJS + PostgreSQL service (Phase 1 of `ROADMAP.md`) —
see `CHANGELOG.md` for what's built, `TESTING.md` for what's verified, and
`OPEN_DECISIONS.md` for every assumption made to keep building without waiting on
external sign-off. The frontend (`src/Ember.jsx`) is still the client-only prototype
described in the planning docs below and is not yet wired to this backend.

**Planning documents** (written before Phase 1, still the forward-looking source for
what's ahead — Phase 0 legal/product decisions, later phases, compliance posture):

- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — target system architecture; §1a covers what's
  actually built vs. planned.
- [`DATABASE_SCHEMA.md`](./DATABASE_SCHEMA.md) — schema rationale; `backend/prisma/schema.prisma`
  is the running source of truth.
- [`THREAT_MODEL.md`](./THREAT_MODEL.md) — threats by user flow, plus a risk register.
- [`ROADMAP.md`](./ROADMAP.md) — phased plan from MVP to enterprise scale, with explicit
  gates between phases.
- [`COMPLIANCE_CHECKLIST.md`](./COMPLIANCE_CHECKLIST.md) — GDPR/CCPA/COPPA/TCPA/PCI-DSS/
  SOC 2 readiness checklist, framed for legal review, not self-certification.

**Engineering documents** (written during/after Phase 1, describing what was actually built):

- [`CHANGELOG.md`](./CHANGELOG.md) — what shipped in Phase 1.
- [`OPEN_DECISIONS.md`](./OPEN_DECISIONS.md) — every assumption made to keep moving
  without external confirmation: why, the impact, and what still needs sign-off. **Read
  this before treating anything in Phase 1 as final.**
- [`API.md`](./API.md) — endpoint reference (the live source of truth is `GET /docs` when
  the server is running).
- [`SECURITY_NOTES.md`](./SECURITY_NOTES.md) — the security controls actually
  implemented, mapped to `THREAT_MODEL.md`.
- [`DEPLOYMENT.md`](./DEPLOYMENT.md) — how to actually run this locally (verified) and
  what's still needed for a real deployment.
- [`TESTING.md`](./TESTING.md) — what's covered by the 39 passing tests, what isn't, and why.

Read `OPEN_DECISIONS.md` and `ROADMAP.md` Phase 0 first. Several items in both (launch
jurisdiction, age-assurance approach, whether to migrate off self-hosted auth) are
product/legal decisions that the rest of this document set — and the running code —
depends on, and none of them were made unilaterally by engineering.
