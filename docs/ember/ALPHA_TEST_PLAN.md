# Ember — Controlled External Alpha Test Plan

For a cohort of approximately 25–100 testers. This is a plan — it does not start until
`PRODUCTION_READINESS_REPORT.md`'s conditions are met (real infrastructure deployed and
verified, report/block UI shipped, legal documents in place, a named on-call owner). Nothing
in this document should be read as "alpha is live."

## Eligibility

- 18+ (self-attested date of birth at registration — see `SECURITY_NOTES.md`/`OPEN_DECISIONS.md`
  D-02 for the known limitation of self-attestation as an age-assurance control; not
  strengthened for alpha, tracked as a pre-general-availability item).
- Recruited directly by the team (personal networks, a waitlist, or an explicit invite
  flow) — not an open/public signup. No paid acquisition, no public app-store listing, no
  organic discovery mechanism for this phase.
- Each tester explicitly informed, before registering, that: this is a pre-launch alpha,
  data may be reset without notice, the service may go offline without notice, and photos/
  messages are real (not seeded/fake) since this is a real product test, not a demo.
- Testers must agree to whatever lightweight terms/privacy notice exists for the alpha
  (see `PRODUCTION_READINESS_REPORT.md`'s legal-document condition) before an invite is
  issued.

## Tester instructions

Provided as a short onboarding document (not part of this file — written once a real URL
exists), covering: how to register, how to verify email, how to build a profile, how to
report/block, how to reach support, and an explicit statement that this build may contain
bugs and testers should expect to encounter them.

## Bug reporting

- A single, clearly-labeled channel (a form, or a monitored email/chat address — the exact
  mechanism is an operational decision, not an engineering one; `PRODUCTION_READINESS_REPORT.md`
  lists a support channel as a launch condition).
- Minimum information requested per report: what they were doing, what they expected, what
  happened, and — if they have it — the `requestId` from any error response they saw (every
  error response includes one; see `OPERATOR_RUNBOOK.md`'s troubleshooting section for why
  this collapses "find the exact log line" from a search to a direct lookup).
- Triage cadence: reports reviewed at least once per business day during the alpha window,
  more frequently in the first 48 hours after any new cohort admitted.

## Feature feedback

Separate from bug reports — a lighter-weight channel (the same form/inbox, tagged
differently, or a short periodic survey) for "this was confusing" / "I wanted X" feedback,
reviewed on a slower cadence than bugs. Feature feedback should inform
`ROADMAP.md`'s prioritization, not trigger mid-alpha feature work — see the "Rollback
criteria" section below for the line between a bug fix and scope creep during the alpha
window itself.

## Incident escalation

1. Anyone (tester, team member, or an automated alert per `DEPLOYMENT_READINESS_CHECKLIST.md`'s
   Monitoring section) identifies a suspected incident.
2. The named on-call owner (`PRODUCTION_READINESS_REPORT.md`'s launch condition) is
   notified via the paging channel established for the alpha.
3. `OPERATOR_RUNBOOK.md`'s "Troubleshoot" section is the first reference for diagnosis.
4. **Safety incidents** (a report of harassment, a suspected minor, a credible safety
   threat) are escalated immediately and separately from technical incidents — a
   moderator-permissioned account (granted per `OPEN_DECISIONS.md` D-03's direct-database
   process) reviews the moderation queue, not just engineering.
5. Any incident involving actual or suspected unauthorized access to user data triggers
   the incident-response process named in `DEPLOYMENT_READINESS_CHECKLIST.md`'s Incident
   Response section — engineering does not decide alone whether/how to notify affected
   users; that's a joint call with whoever owns that decision organizationally.

## Support process

A monitored channel (see Bug Reporting above) is the single front door for testers. Support
requests are triaged same-day during the alpha window. No promise of 24/7 support for a
25–100 person alpha — response-time expectations should be stated plainly to testers at
onboarding, not implied.

## Rollback criteria

Any of the following triggers an immediate rollback (per `OPERATOR_RUNBOOK.md`'s "Roll
back" section) rather than a forward-fix attempt, unless the on-call owner has a specific,
fast, low-risk forward fix ready:

- A confirmed data-integrity bug affecting more than a handful of accounts.
- A confirmed security vulnerability actively being exploited, or with a credible near-term
  exploitation risk.
- A safety-critical feature (reporting, blocking) confirmed broken in production.
- Error rate or latency degradation matching an alert condition in
  `DEPLOYMENT_READINESS_CHECKLIST.md`'s Monitoring section, sustained past its threshold.

A rollback is followed by the full "Launch verification" sequence in `GO_LIVE_CHECKLIST.md`
before re-admitting testers — a rollback is a deploy, and gets the same verification.

## Success metrics

Kept deliberately modest for a 25–100 person alpha — this phase is validating that the
system operates correctly under real (if small) usage, not measuring growth or engagement
at a scale this cohort can't produce meaningfully:

- **Reliability**: uptime and error rate stay within whatever SLO
  `DEPLOYMENT_READINESS_CHECKLIST.md`'s alarms are configured against, with zero
  data-integrity incidents.
- **Core flow completion**: a meaningful share of registered testers complete
  registration → profile → at least one match → at least one message, without a
  bug-driven drop-off pattern showing up in the reports channel.
- **Safety mechanism usage produces correct outcomes**: every real report/block filed
  during the alpha reaches a real moderator resolution within the process's expected
  timeframe, with zero reports lost or silently unaddressed.
- **Bug volume and severity trend downward** over the alpha window, not flat or rising —
  a rising trend after week one is itself a signal to pause admitting new testers rather
  than push forward on schedule.

Explicitly **not** a success metric for this phase: retention, viral growth, revenue, or
any metric that assumes production scale. Those belong to a later phase, once this one
has actually validated the system operates safely and correctly.
