# Ember — Threat Model & Risk Register

**Status:** Planning document for the target architecture in `ARCHITECTURE.md`. No
production system exists to audit yet, so this models *anticipated* threats against the
proposed design. Re-run this exercise against the real system before launch, and again
before any major feature (e.g. video calling, background checks) ships — a threat model
written before a line of code exists is a starting hypothesis, not a completed audit.

**Not a substitute for a professional penetration test or third-party security audit.**

---

## 1. What's actually being protected, in priority order

For a dating platform specifically, the ranked priority is different from a typical SaaS
product: **physical safety of users who meet in person** outranks data confidentiality,
which outranks service availability.

1. Physical safety (a user meeting a stranger from the app should not come to harm)
2. Identity & PII (government ID, phone, email, precise location, messages)
3. Minors' exclusion from the platform entirely
4. Financial integrity (romance scams, payment fraud)
5. Platform integrity (fake accounts, bots, catfishing corrupting match quality)
6. Availability (the app being up) — real, but lowest priority of the six

## 2. Threats by user-facing flow

### 2.1 Signup & identity

| Threat | STRIDE | Mitigation | Residual risk |
|---|---|---|---|
| Minor creates an account by lying about age | Spoofing | Self-attested DOB is not sufficient alone; require ID-based age assurance at minimum for accounts that unlock messaging/meeting features, not just a checkbox | Self-attestation-only launch carries real residual risk — flag as an open decision in `ARCHITECTURE.md` §6 |
| One person creates many accounts (ban evasion, scam farms) | Spoofing | One-account-per-phone-number enforcement; device fingerprinting; IP reputation scoring | Determined actors rotate SIMs/devices — layer signals, don't rely on one |
| Fake/stolen photos used for a profile (catfishing) | Spoofing | Liveness-checked selfie verification tied to profile photos (selfie-to-photo match) | Verification is opt-in unless made mandatory for messaging — decide the bar explicitly |
| Credential stuffing against auth provider | Spoofing | Delegated to Auth0/Clerk; enforce MFA option, breached-password screening | Depends on provider's own posture — vet the provider's security attestations |

### 2.2 Matching & profile data

| Threat | STRIDE | Mitigation | Residual risk |
|---|---|---|---|
| Scraping profile photos/bios at scale | Information disclosure | Rate limiting, bot detection (behavioral + fingerprint), authenticated-only profile access | Public-facing marketing pages must not leak real user profiles |
| Precise location inferred from repeated "distance" values (trilateration) | Information disclosure | Show coarse/rounded distance bands, not exact distance; never expose raw coordinates to other users | Classic dating-app vulnerability class — treat distance display as a hostile-input surface, not a UI nicety |
| Inference attacks via filters (e.g. narrowing search to identify one person) | Information disclosure | Minimum result-set thresholds before returning filtered results | Low severity but easy to fix; include in QA test plan |

### 2.3 Messaging & meeting

| Threat | STRIDE | Mitigation | Residual risk |
|---|---|---|---|
| Romance scam (financial grooming over time) | Repudiation / fraud | Behavioral scam-pattern detection (requests for money, off-platform payment push, urgency language) surfaced to a human review queue; in-app warnings on common scam phrases | Pattern-detection has false negatives against novel scripts — pair with user education, not detection alone |
| Off-platform redirection to evade moderation | Tampering | Detect and flag attempts to move to unmonitored channels early in a conversation (pattern-based), without blanket-scanning all message content in ways that violate the privacy principles in `ARCHITECTURE.md` | Tension between moderation and message privacy — needs an explicit policy decision, not just a technical default |
| Harassment / threatening messages | Denial of service (to the victim's experience) | Real-time toxicity/threat classifier + one-tap report-and-block flow that doesn't require the victim to keep engaging to document it | False positives block legitimate messages — needs a human appeal path, not fully automated enforcement |
| In-person meeting leads to physical harm | *(outside STRIDE — physical safety)* | Time-boxed live-location sharing, post-date check-in prompts, panic button wired to a real response process | The panic button is only as good as what's behind it — "alerts a trusted contact" is not the same guarantee as "alerts emergency services," and the product must not imply the latter unless it's actually built |

### 2.4 Payments

| Threat | STRIDE | Mitigation | Residual risk |
|---|---|---|---|
| Card data theft from our servers | Information disclosure | Never touch raw card data — Stripe-hosted Checkout/Elements only (PCI SAQ-A scope) | Scope creep (e.g. building a custom checkout UI that touches card fields) would re-expand PCI scope — guard this architecturally, not just by policy |
| Chargeback / subscription fraud | Repudiation | Stripe Radar + webhook-driven subscription state (never trust client-reported payment status) | |
| Fake "boost/gift purchase" scams by non-platform actors impersonating Ember | Spoofing | Brand/domain monitoring, clear official-channel communication | Low control — mostly a user-education problem |

### 2.5 Admin & moderation

| Threat | STRIDE | Mitigation | Residual risk |
|---|---|---|---|
| Moderator/admin account compromise | Elevation of privilege | MFA mandatory for `moderator`/`admin` roles, no exceptions; least-privilege RBAC; every admin action audit-logged | Insider misuse by a legitimate credential holder is not fully preventable by access control alone — pair with audit review, not just prevention |
| Moderator abuse of access to private messages/photos for non-moderation purposes | Elevation of privilege | Access to user content requires an open report/case ID logged against it — no unscoped browsing of user data | This is a policy + logging control, not just a technical one; needs an explicit internal-abuse reporting channel too |
| AI moderation model manipulated via adversarial inputs (e.g. text designed to evade toxicity classifiers) | Tampering | Human review queue as a backstop, not AI-only enforcement; periodic red-teaming of the classifier | AI moderation should be described to users as "AI-assisted," not "AI-verified" — don't overstate automated coverage |

## 3. Risk register

| ID | Risk | Likelihood | Impact | Mitigation | Status |
|---|---|---|---|---|---|
| R-01 | Minor gains platform access | Medium | Critical | ID-based age assurance, not self-attestation alone | **Open decision** — see `ARCHITECTURE.md` §6 |
| R-02 | Romance scam causes user financial harm | High (industry base rate is high for this category) | High | Behavioral detection + user education + reporting friction reduction | Planned for Phase 2 |
| R-03 | Data breach exposes PII (phone/email/messages) | Low-Medium | Critical | Encryption at rest + in transit, least-privilege access, no PII in logs | Baseline control, Phase 1 |
| R-04 | Panic button implies a safety guarantee the product doesn't actually provide | Medium | Critical (trust + legal exposure) | Precise, accurate copy about what the feature does and does not do; legal review of all safety-feature marketing language | **Must resolve before launch** |
| R-05 | Fake accounts degrade match quality at scale | High | Medium | Layered fraud signals (device, IP, phone uniqueness, behavior) | Planned for Phase 2 |
| R-06 | Moderator insider abuse of user data access | Low | High | Scoped access + audit logging + internal reporting channel | Planned for Phase 2 |
| R-07 | Payment/card data exposure | Low (if Stripe-hosted flow is followed) | Critical | Architectural constraint: never build a custom card-input form | Baseline control, Phase 1 |
| R-08 | Location trilateration deanonymizes a user | Medium | High | Rounded/banded distance display only | Baseline control, Phase 1 |
| R-09 | AI-generated icebreakers/coaching produce harmful or manipulative content | Low-Medium | Medium | Content filtering on AI outputs, clear "AI-assisted" labeling, human-reportable | Planned for Phase 3 (AI features) |
| R-10 | Third-party verification/moderation vendor itself has a breach | Low | High (reputational + user harm) | Vendor security review before selection; contractual data-handling terms | Must complete before Phase 2 vendor selection |

## 4. Explicitly out of scope for this document

- State-sponsored / advanced persistent threat actors — not a proportionate threat model
  for a consumer dating app at MVP stage; revisit if the product handles government
  officials, journalists, or similarly targeted populations at scale.
- Physical security of any office/data-center — inherited from the cloud provider's
  shared-responsibility model, not modeled here.
