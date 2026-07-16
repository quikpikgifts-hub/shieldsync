# Ember — Planning Documents

These are planning artifacts for a hypothetical production version of Ember. They exist to
inform engineering decisions and to give legal/security reviewers a concrete starting
point — they are **not** a compliance certification, a completed security audit, or a
description of anything currently built. The only thing that actually exists today is
`src/Ember.jsx`, a client-only prototype with mock data and no backend.

- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — target system architecture, phased so
  infrastructure complexity is added only when real scale justifies it.
- [`DATABASE_SCHEMA.md`](./DATABASE_SCHEMA.md) — proposed PostgreSQL schema and ER
  diagram, with PII-handling notes per table.
- [`THREAT_MODEL.md`](./THREAT_MODEL.md) — threats by user flow, plus a risk register.
- [`ROADMAP.md`](./ROADMAP.md) — phased plan from MVP to enterprise scale, with explicit
  gates between phases.
- [`COMPLIANCE_CHECKLIST.md`](./COMPLIANCE_CHECKLIST.md) — GDPR/CCPA/COPPA/TCPA/PCI-DSS/
  SOC 2 readiness checklist, framed for legal review, not self-certification.

Read `ROADMAP.md` Phase 0 first — several items there (launch jurisdiction, age-assurance
approach, what the safety features actually do end-to-end) are decisions the rest of this
document set depends on, and none of them are engineering calls to make alone.
