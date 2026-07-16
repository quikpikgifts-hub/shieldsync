# Ember — Compliance Readiness Checklist

**This is not legal advice and does not constitute compliance certification.** It is an
engineering-readiness checklist meant to prepare for review by qualified privacy counsel
and, where relevant, a licensed PCI-DSS QSA. Every unchecked item below should be treated
as "not yet legally reviewed," not "not required." Do not collect real user data, take
real payments, or launch to real users based on this checklist alone.

---

## GDPR / UK GDPR (applies if serving EU/UK users — see `ARCHITECTURE.md` §6)

| Obligation | Engineering-readiness item | Status |
|---|---|---|
| Lawful basis for processing | Documented per data category (consent vs. legitimate interest vs. contract) | Not started — Phase 0 |
| Right to access | Automated data-export workflow (`data_requests` table, `DATABASE_SCHEMA.md`) | Planned Phase 1 |
| Right to erasure | Automated account-deletion workflow, including data held by vendors (verification, moderation) | Planned Phase 1 |
| Data portability | Export in a structured, machine-readable format | Planned Phase 1 |
| Privacy by design/default | Data minimization applied per table (see 🔒/🚫 markers in `DATABASE_SCHEMA.md`) | Baseline, Phase 1 |
| DPO / representative (if required by scale/jurisdiction) | Legal determination, not an engineering task | Not started — Phase 0 |
| International transfer mechanism (SCCs etc., if data leaves the EU) | Depends on hosting region decision | Not started — Phase 0 |
| Breach notification process (72-hour clock) | Incident response plan must name this explicitly once written | Deferred until real infra exists |

## CCPA / CPRA (California)

| Obligation | Engineering-readiness item | Status |
|---|---|---|
| Right to know / access | Same automated export as GDPR access right | Planned Phase 1 |
| Right to delete | Same automated deletion workflow | Planned Phase 1 |
| Right to opt out of sale/sharing | Ember does not plan to sell user data — confirm this stays true before any ad-monetization decision, and provide the opt-out control regardless | Not started — Phase 0 policy decision |
| "Do Not Sell/Share My Info" link | Front-end requirement, trivial once the policy decision above is made | Planned Phase 1 |
| Sensitive personal information handling (precise geolocation is explicitly SPI under CPRA) | Precise location already scoped as time-boxed/opt-in only in `DATABASE_SCHEMA.md` | Baseline, Phase 1 |

## COPPA

| Obligation | Engineering-readiness item | Status |
|---|---|---|
| No collection of data from children under 13 | Not directly applicable in the intended sense — the real requirement for a dating platform is **excluding minors entirely** (18+), which is a stricter bar than COPPA's under-13 threshold | See R-01 in `THREAT_MODEL.md` — **open decision, must resolve in Phase 0** |

## CAN-SPAM / TCPA

| Obligation | Engineering-readiness item | Status |
|---|---|---|
| Unsubscribe mechanism in every marketing email | Standard transactional-email-provider feature | Planned Phase 1 |
| No misleading subject lines/headers | Content/policy item, not engineering | Ongoing |
| Prior express written consent for marketing SMS (TCPA) | `consent_records` table with per-purpose granularity (`DATABASE_SCHEMA.md`) | Planned Phase 1 |
| Honor opt-outs (STOP keyword etc.) immediately | Twilio-side handling + consent record update | Planned Phase 1 |

## PCI-DSS

| Obligation | Engineering-readiness item | Status |
|---|---|---|
| Minimize PCI scope | Architectural constraint: Stripe-hosted Checkout/Elements only, never a custom card form (see `THREAT_MODEL.md` R-07) | Baseline, Phase 1 — puts Ember in **SAQ-A** scope, the lightest tier |
| Annual self-assessment questionnaire | Business/finance task once transacting real payments | Deferred until Phase 1 payments go live |

## SOC 2 (Type II)

| Obligation | Engineering-readiness item | Status |
|---|---|---|
| Trust service criteria controls (security, availability, confidentiality, privacy) operating *consistently over time* | Everything in `ARCHITECTURE.md` §4–5 must be operating in production, not just designed | This is a **Phase 5** item by design — an audit before the controls have a track record produces a report that says nothing |
| Formal audit engagement | Requires a licensed auditor, months of evidence collection | Not started |

## OWASP Top 10 (engineering hygiene, not a legal requirement, but table-stakes)

| Risk category | Mitigation | Status |
|---|---|---|
| Broken access control | RBAC + audit logging (`ARCHITECTURE.md` §4) | Baseline, Phase 1 |
| Cryptographic failures | TLS 1.3, encryption at rest, no hand-rolled crypto | Baseline, Phase 1 |
| Injection | ORM-enforced parameterized queries | Baseline, Phase 1 |
| Insecure design | This threat-modeling exercise itself, repeated per major feature | Ongoing |
| Security misconfiguration | Security headers, CSP, least-privilege infra roles | Baseline, Phase 1 |
| Vulnerable/outdated components | Automated dependency scanning in CI | Planned Phase 1 |
| Auth/session failures | Delegated to Auth0/Clerk rather than hand-rolled | Baseline, Phase 1 |
| Data integrity failures | Signed/verified webhook payloads (Stripe, vendors) | Baseline, Phase 1 |
| Logging/monitoring failures | APM + audit log from day one | Baseline, Phase 1 |
| SSRF | Egress restrictions on server-side fetch of user-supplied URLs (if any feature does this) | Design-time check per feature |

## Before this checklist can move from "planning" to "in progress" anywhere above

1. Privacy counsel engaged (Phase 0).
2. Launch jurisdiction decided (Phase 0) — determines which of the above actually apply
   on day one vs. later.
3. Age-assurance approach decided (Phase 0) — the single highest-consequence open item
   in this entire document.
