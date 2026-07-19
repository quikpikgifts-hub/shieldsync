# Ember — Security Summary

Full detail: `../SECURITY_NOTES.md` (controls implemented), `../PRODUCTION_SECURITY_REPORT.md`
(real checks against a live running instance), `../LOGGING_AUDIT.md` (every log call site
reviewed for sensitive-data leakage), `../ENTERPRISE_READINESS_REPORT.md` (independent
scoring). This page condenses all four.

## What's protected, and how

- **Passwords**: argon2id hashing, never bcrypt/sha. Timing-safe login (a nonexistent
  account still runs a dummy argon2 verify) — wrong-password and no-such-account return the
  identical response.
- **Sessions**: short-lived JWTs (15 min) + opaque, hashed-at-rest refresh tokens.
  Rotation-with-reuse-detection — a replayed refresh token revokes the entire session, not
  just itself.
- **Authorization**: every route protected by default; permissions checked live against the
  database on every request, never cached in a JWT — revoking access takes effect
  immediately, not at token expiry.
- **Rate limiting & lockout**: Redis-backed, atomic (Lua-scripted, no race condition under
  concurrent load — verified for real, see `../LOAD_TEST_REPORT.md`), fails *closed* (not
  open) if Redis is unavailable.
- **Photo ownership**: a real Critical vulnerability was found and fixed this project — a
  user could hijack another user's photo via a leaked storage key. Fixed by validating
  ownership on registration and never exposing raw storage keys in any response. Verified
  both by an automated regression test and a live re-check against a running instance.
- **Transport/headers**: full Helmet default header set (CSP, HSTS, X-Frame-Options, etc.)
  confirmed present on real responses, not just configured in code.
- **CORS**: explicit origin allowlist, never a wildcard — confirmed a disallowed origin
  receives no `Access-Control-Allow-Origin` header on a real preflight request.
- **CSRF**: not applicable — token-based auth only, no session cookie for an attack to ride
  on.
- **Audit trail**: every sensitive action (logins, lockouts, role changes, moderation
  actions, PII views) writes to an append-only log; confirmed real rows get written for
  real actions, not just that the code path exists.
- **Secrets**: never committed, never logged in a leakable form (a shared helper scrubs any
  connection-string-shaped value from every "log an unexpected error" call site).

## What's been independently re-verified, not just claimed

An RC-1 security re-review — deliberately not a rubber-stamp of earlier audits — found and
fixed one Critical (photo hijack) and one High (missing rate limits on registration/email-
verification-request) finding, both closed with regression tests before this document was
written. A Phase 5 pass then re-confirmed the fix and every other control against a real
running instance, not just against source code.

## What remains unverified (and why)

Exclusively the parts that require real cloud infrastructure to test: real AWS IAM
enforcement, real TLS termination, real Secrets Manager behavior, real internet-facing
exposure. None of these can be tested without an AWS account, which doesn't exist yet — see
`../PRODUCTION_READINESS_REPORT.md`.

## One open item, by design

`ModerationService.assign` doesn't verify the target actually holds moderator permissions
before assignment — a case-routing data-integrity issue, not an authorization bypass
(deferred in RC-1 to keep that pass in Critical/High-fix-only scope; tracked for a future
pass, not a launch blocker).
