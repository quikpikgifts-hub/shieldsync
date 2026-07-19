# Ember — Executive Summary

Ember is a dating-platform backend: authentication, profiles, matching, messaging, photo
uploads, and trust & safety tooling (reporting, blocking, moderation), built on NestJS/
PostgreSQL/Redis, with a matching React frontend client in the same repository.

**Engineering is complete and independently re-verified twice** — once for code and
security (RC-1, which found and fixed a Critical vulnerability before any real user could
be exposed to it), and once for operational behavior (Phase 5, which ran the real
application against real local infrastructure and confirmed all 42 core user-journey checks
pass for real). 90 automated tests pass against real infrastructure, not mocks.

**Infrastructure is fully planned and never deployed.** Every AWS resource this system
needs has a reviewed, ready-to-execute Terraform configuration. No AWS account, domain, or
email vendor has ever been available to this project — the one set of credentials made
available turned out to be invalid, confirmed directly rather than assumed.

**Current recommendation: NO-GO for launch today, GO WITH CONDITIONS on the code itself.**
The blockers are not engineering unknowns — they're a real AWS account, a small
(already-scoped) frontend feature for reporting/blocking users, legal documents, and a
named support owner. See `PRODUCTION_CHECKLIST.md` in this package for the complete,
evidence-backed list, and `../EXECUTIVE_READINESS_REPORT.md` for the full narrative this
summarizes.

## What this package contains

| Document | Purpose |
|---|---|
| `DEPLOYMENT_GUIDE.md` | How to actually deploy this, start to finish |
| `ARCHITECTURE_DIAGRAM.md` | System structure, visually |
| `INFRASTRUCTURE_DIAGRAM.md` | The AWS topology this deploys into |
| `DATABASE_DIAGRAM.md` | The real schema, visually |
| `API_REFERENCE.md` | Every endpoint, condensed |
| `SECURITY_SUMMARY.md` | What's protected and how, condensed |
| `OPERATIONS_GUIDE.md` | Running it once it's live |
| `DISASTER_RECOVERY_GUIDE.md` | What happens when something breaks |
| `ALPHA_TEST_GUIDE.md` | The controlled 25-100 person alpha plan |
| `PRODUCTION_CHECKLIST.md` | Every remaining requirement, one table |

Every document in this package is a curated summary of a fuller, authoritative document
under `docs/ember/` — follow the links in each for exact commands, full detail, and
evidence citations. This package is the on-ramp, not a replacement for the detailed docs.
