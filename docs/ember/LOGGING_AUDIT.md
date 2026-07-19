# Ember Backend — Logging Audit (RC-1)

Every logging statement in `backend/src` (excluding `*.spec.ts`), independently re-verified
against source — not assumed from prior documentation — as part of the RC-1 verification
pass. See `docs/ember/CHANGELOG.md`'s RC-1 entry for the fixes this audit produced.

## Architecture

- **Structured logging**: `nestjs-pino` (pino + pino-http) is wired globally in
  `src/observability/logger.module.ts` and applied via `app.useLogger(app.get(Logger))` in
  `src/main.ts`. Every `new Logger(X.name)` call site (the NestJS-standard logger used
  throughout the app) is routed through pino once that's called — all output is structured
  JSON in production, not console text.
- **`console.*` calls**: zero, anywhere in `backend/src` (re-verified this pass).
- **HTTP request/response auto-logging**: pino-http's default `req`/`res` serializers are
  used (method, url, headers, remoteAddress/port, statusCode) — **request/response bodies
  are never logged**, no custom body serializer is configured. `/live`, `/ready`, `/health`,
  `/metrics` are excluded from auto-logging.
- **Redact config** (`logger.module.ts`): `req.headers.authorization`, `req.headers.cookie`,
  `req.body.password`, `req.body.newPassword`, `req.body.refreshToken` → `"[redacted]"`.
  These `req.body.*` paths are currently **inert** — the default serializer never includes
  `req.body` — kept as defense-in-depth for if a future change adds body logging. **If
  body-level request logging is ever added, the redact list must be expanded first**
  (`req.body.token`, `res.body.accessToken`, `res.body.refreshToken` at minimum) — do not
  assume the existing three paths already cover it.
- **Audit logging** is a fully separate mechanism (`src/audit/audit.service.ts`, writing to
  the append-only `AuditLog` Postgres table), not part of the pino/Logger pipeline — out of
  scope for this log-line review, though its own failure path does emit a Logger call (see
  below).
- **Sentry**: `captureException()` is called from the global exception filter for 5xx/
  unhandled errors only (`tracesSampleRate: 0`, error-tracking only).

## Fixes applied this pass

A raw `Error` object (rather than just its message) was being passed to the logger at five
call sites. `pg`/Prisma and `ioredis` connection-failure errors can, in some driver
versions, embed the connection string — including its password — in the error's
message/stack. None of these were a *confirmed* leak (no driver version currently in use
was shown to actually do this), but passing the raw object was needless exposure for a
risk that costs nothing to close. Fixed by routing all five through a new shared helper,
`src/common/logging/safe-error.ts`, which extracts `.message`/`.stack` as a string and
redacts any `scheme://user:pass@host`-shaped substring before it reaches a log sink:

| File | Line | Before | After |
|---|---|---|---|
| `common/filters/all-exceptions.filter.ts` | 63 | `exception.stack` | `safeErrorMessage(exception)` |
| `common/filters/all-exceptions.filter.ts` | 74-77 | `exception.stack \| String(exception)` | `safeErrorMessage(exception)` |
| `redis/redis.module.ts` | 49 | `logger.error("Redis client error", error)` | `safeErrorMessage(error)` |
| `queue/inline-job-queue.service.ts` | 34 | `error as Error` | `safeErrorMessage(error)` |
| `auth/auth.service.ts` | 237 | `error as Error` | `safeErrorMessage(error)` |
| `audit/audit.service.ts` | 65 | `error as Error` | `safeErrorMessage(error)` |

This closes the risk at every "log an unexpected error" call site in the app in one place,
rather than case by case. It also makes Sentry's `captureException(exception)` calls in the
exception filter safer by construction, since Sentry receives the same `exception` object
the filter logs — Sentry's own default scrubbing does not know about connection-string
shapes.

## Remove-candidates

**None.** No leftover `console.log`, no full-object/response dump, no development-only
tracing was found anywhere in `backend/src`. Every log call reviewed serves an operational,
security, audit-adjacent, or infrastructure purpose.

## Sensitivity review — full table

| File:line | Level | Classification | Sensitivity | Note |
|---|---|---|---|---|
| `prisma/prisma.service.ts` | log | KEEP (infra) | NONE | Static "Connected to PostgreSQL" string. |
| `redis/redis.module.ts` (unset-URL warning) | warn | KEEP (infra) | NONE | Static string; no URL/credential value interpolated. |
| `redis/redis.module.ts:49` | error | KEEP (infra) | **FIXED** | Was a raw Error object; now `safeErrorMessage()`. |
| `auth/password-reset.service.ts` (rate-limited log) | warn | KEEP (abuse signal) | LOW | Logs the raw requested email address (PII) when the per-email reset-request limit trips. Operationally useful as an abuse signal; flagged as PII a stricter minimization pass could hash/truncate. Not a blocker — reset-request logs are already access-restricted operational logs, not client-facing. |
| `auth/auth.service.ts:237` | error | KEEP (security-adjacent) | **FIXED** | New-device-alert email failure; was a raw Error object, now `safeErrorMessage()`. |
| `common/filters/all-exceptions.filter.ts` (both branches) | error | KEEP (critical) | **FIXED** | Catch-all for every 5xx/unhandled exception app-wide — the single highest-value place to have closed the connection-string-in-stack risk. Confirmed the HTTP response body sent to the client never includes stack/exception detail — only this server-side log line does. |
| `email/notification-email.service.ts` (send-success / SMTP-not-configured logs) | log/warn | KEEP | LOW | Logs recipient email address (PII) and template name. Does **not** log the `variables` object — confirmed the actual reset/verification token/link is never logged here. SMTP-not-configured warning only fires when `SMTP_HOST` is unset (dev/CI), effectively never in production. |
| `integrations/email/smtp-email.provider.ts` (3 call sites) | error/warn | KEEP | LOW | Logs recipient email + `smtpError.message` (an SMTP protocol response string) — never the raw error object, never `smtpPassword`/`smtpUser`. Confirmed by reading the constructor: credentials only ever flow into `nodemailer.createTransport({auth})`, never into a log call. |
| `profiles/thumbnail.service.ts` (2 call sites) | log/warn | KEEP | NONE | Logs `photoId` + dimensions only — no storage key, no PII. |
| `audit/audit.service.ts:65` | error | KEEP (critical) | **FIXED** | Audit-write failure is itself a security-relevant event — correctly logged loudly. Was a raw Error object, now `safeErrorMessage()`. |
| `queue/bullmq-job-queue.service.ts` | error | KEEP | NONE | Logs only `error.message`, never `job.data` (which can carry email template variables) — confirmed safe by reading the full processor registration. |
| `queue/inline-job-queue.service.ts:34,37` | error/warn | KEEP | **FIXED** (line 34) | Line 34 was a raw Error object, now `safeErrorMessage()`; line 37 (retry warning) carries no data payload. |

No log call site was found to log a password (hashed or plaintext), a JWT, a refresh token,
an API key, a signing/SMTP/S3 secret, or a session identifier. Email addresses (PII) appear
in a small number of operational/abuse-signal logs, noted above as LOW — acceptable for an
access-restricted operational log stream, not a finding requiring a code change before RC-1.

## Recommendations not applied this pass (tracked, not blockers)

- Consider hashing/truncating the email address in the three LOW-flagged log lines above as
  a PII-minimization improvement — cosmetic, not a security gap, deferred to keep this pass
  scoped to verification rather than new polish.
- If request-body logging is ever added for debugging, expand the redact list first (see
  Architecture section above) — documented here specifically so a future contributor
  doesn't assume more coverage exists than actually does.
