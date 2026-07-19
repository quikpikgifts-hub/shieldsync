# Ember — Alpha Test Guide (Summary)

Full detail: `../ALPHA_TEST_PLAN.md`. For a cohort of approximately 25-100 testers, recruited
directly (not public signup), once every blocking item in `PRODUCTION_CHECKLIST.md` is
closed — this plan does not start until then.

## Eligibility

18+ (self-attested — a known, accepted limitation for this scale, see `../OPEN_DECISIONS.md`
D-02), recruited directly, explicitly informed this is a pre-launch alpha where data may
reset and the service may go offline without notice.

## Tester instructions

A short onboarding document (written once a real URL exists) covering registration, email
verification, profile setup, how to report/block, and how to reach support.

## Bug reporting

One clearly-labeled channel; minimum info requested is what they were doing, what they
expected, what happened, and the `requestId` from any error they saw. Triaged at least once
per business day.

## Feature feedback

Separate, lighter-weight channel from bug reports — informs `../ROADMAP.md`, doesn't
trigger mid-alpha feature work.

## Incident escalation

Technical incidents go to the named on-call owner. **Safety incidents** (harassment
reports, suspected minors, credible threats) escalate separately and immediately to a
moderator-permissioned account — engineering doesn't handle these alone.

## Support process

One monitored channel, same-day triage during the alpha window. No 24/7 promise for a
25-100 person cohort — set that expectation explicitly at onboarding.

## Rollback criteria

Immediate rollback (not a forward-fix attempt) for: a confirmed data-integrity bug
affecting multiple accounts, an actively-exploited security vulnerability, a broken
safety-critical feature (reporting/blocking), or a sustained alarm-threshold breach.

## Success metrics

Deliberately modest for this scale: reliability within SLO with zero data-integrity
incidents, a meaningful share of testers completing the full core flow (register → profile
→ match → message), every real report/block reaching a correct moderator resolution, and a
bug-volume trend that goes down over the window, not up. **Not** measured: retention,
growth, or revenue — those belong to a later phase.
