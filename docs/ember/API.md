# Ember Backend — API Reference

Narrative overview. The authoritative, always-current reference is the live OpenAPI
document at `GET /docs` when running the server (disabled in `NODE_ENV=production` — see
`src/configure-app.ts`) — this file exists so the API shape can be read without running
the server, and won't always be perfectly in sync with it.

All endpoints are prefixed with nothing (routes are mounted at the app root, e.g.
`http://localhost:3001/auth/register`). All authenticated endpoints expect
`Authorization: Bearer <accessToken>`.

## Auth (`src/auth/`) — public except `/auth/logout` and the email-verification-request endpoint

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/auth/register` | Public | Rate-limited to 5/min per IP (RC-1: previously unthrottled — see `CHANGELOG.md`). Creates an account, returns `{ user, tokens }`. Rejects under-18 (self-attested DOB), weak passwords, duplicate emails. |
| POST | `/auth/login` | Public | Rate-limited to 5/min per IP *and* locked out after repeated failures against one email address (independent of IP — see `SECURITY_NOTES.md`). Returns `{ user, tokens }`. Generic error for both wrong password and nonexistent account. A login from a never-seen device/IP for that account triggers a "new sign-in" email (if SMTP is configured) and an audit entry, without blocking the login. |
| POST | `/auth/refresh` | Public | Body: `{ refreshToken }`. Rotates to a new pair. Reuse of an already-rotated token revokes the whole session. |
| POST | `/auth/logout` | Authenticated | Body: `{ refreshToken }`. Revokes that session and immediately blacklists the presented access token's `jti` (it stops working right away, not just at its natural expiry). Idempotent; a no-op if the refresh token belongs to a different account than the caller. |
| POST | `/auth/email/verification/request` | Authenticated | Rate-limited to 5/min per IP (RC-1: previously unthrottled). No body. Sends (or resends) a verification email to the caller's own address. No-op if already verified. |
| POST | `/auth/email/verification/confirm` | Public | Body: `{ token }` (from the verification email link). Sets `emailVerifiedAt`. Token is single-use and time-boxed. |
| POST | `/auth/password-reset/request` | Public | Rate-limited to 5/min per IP (`@Throttle`, same limit as login) **and** independently limited to 3/hour per email address (`PasswordResetService`'s own counter — a separate, longer-window limit, not the same number as the IP throttle). Body: `{ email }`. Always returns 204 regardless of whether the account exists (anti-enumeration). |
| POST | `/auth/password-reset/confirm` | Public | Body: `{ token, newPassword }`. Sets a new password and revokes every existing session for the account. |

## Users (`src/users/`)

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/users/me` | Authenticated | Own account record (never includes `passwordHash`). |
| GET | `/users` | `users.read` permission | Paginated, filterable by `status`/`email`. |
| GET | `/users/:id` | `users.read` permission | Another user's account record. |

## Profiles (`src/profiles/`)

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET / PUT | `/profiles/me` | Authenticated | Own profile (`PUT` upserts). Each photo in the response has `url`/`thumbnailUrl` — a short-lived signed URL when object storage is configured (see `PRODUCTION_READINESS.md`), or the raw storage key as `url`'s value when it isn't. The raw `storageKey`/`thumbnailStorageKey` fields themselves are never present in the response (RC-1 fix — see `CHANGELOG.md`); this applies identically to `/profiles/:userId`, `/matching/candidates`, and `/matching/likes/received`. |
| GET / PUT | `/profiles/me/preferences` | Authenticated | Match preferences (age range, distance, etc). |
| PUT | `/profiles/me/prompt-answers` | Authenticated | Upserts up to 10 `{ promptKey, answer }` entries. |
| POST | `/profiles/me/photos/upload-url` | Authenticated | Body: `{ contentType }` (`image/jpeg`\|`image/png`\|`image/webp` only). Returns `{ uploadUrl, storageKey, expiresAt }` — a presigned URL the client `PUT`s the file bytes to directly; this API never sees the file. Throws if object storage isn't configured. |
| POST | `/profiles/me/photos` | Authenticated | Registers a `storageKey`. When object storage is configured: rejects (403) a `storageKey` that doesn't belong to the caller (must be prefixed `photos/<callerId>/…`, RC-1 fix — see `CHANGELOG.md`), validates the object actually exists (400 if not), and captures real `contentType`/`byteSizeBytes`, then enqueues background thumbnail generation. Falls back to accepting any client-supplied key with no validation when storage isn't configured (see D-05 in `OPEN_DECISIONS.md`). Always starts `PENDING` moderation. |
| DELETE | `/profiles/me/photos/:photoId` | Authenticated (owner only) | Also deletes the underlying storage object(s) (best-effort) when storage is configured. |
| PATCH | `/profiles/photos/:photoId/moderation` | `moderation.resolve` permission | Approve/reject a photo. |
| GET | `/profiles/:userId` | Authenticated | Public view of another profile. Returns 404 (not 403) if blocked, to avoid revealing block state. |

## Matching (`src/matching/`)

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/matching/candidates` | Authenticated | A batch of other users to decide on, filtered by the caller's age/verified preferences and excluding self, already-decided, and blocked users. No compatibility score (see D-08 in `OPEN_DECISIONS.md`) — over-fetches a pool and filters/paginates in application code since age is derived from `dateOfBirth`, not stored. |
| POST | `/matching/likes` | Authenticated | Body: `{ targetId, action: LIKE\|PASS\|SUPER_LIKE }`. Creates a `Match` + `Conversation` automatically when both parties have liked/super-liked each other. Blocked pairs get 403. |
| GET | `/matching/matches` | Authenticated | Own active matches (match rows only — no profile info; hydrate via `GET /profiles/:userId` per match, as the frontend does). |
| GET | `/matching/likes/received` | Authenticated | Who has liked the caller (excludes anyone blocked in either direction), hydrated with each liker's profile summary. |

## Messaging (`src/messaging/`)

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/conversations/:matchId/messages` | Authenticated (match member only) | Paginated. |
| POST | `/conversations/:matchId/messages` | Authenticated (match member only) | 403 if either party has blocked the other, even post-match. |

## Safety (`src/safety/`)

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/reports` | Authenticated | Files a report; auto-opens or joins an existing open `ModerationCase` for the same subject. |
| GET | `/reports/me` | Authenticated | Reports the caller has filed. |
| GET | `/reports` | `reports.read` permission | All reports, filterable by status. |
| PATCH | `/reports/:id/resolve` | `reports.resolve` permission | Body: `{ status: RESOLVED\|DISMISSED }`. |
| POST | `/blocks` | Authenticated | |
| GET | `/blocks` | Authenticated | Own blocks. |
| DELETE | `/blocks/:blockedId` | Authenticated | |
| GET | `/moderation-cases` | `reports.read` permission | |
| PATCH | `/moderation-cases/:id/assign` | `moderation.assign` permission | |
| PATCH | `/moderation-cases/:id/resolve` | `moderation.resolve` permission | Body: `{ action, notes? }`. `SUSPENDED`/`BANNED` immediately flips the subject's `Users.status` and revokes all their sessions/refresh tokens. |

## Operational endpoints (`src/health/`, `src/observability/`)

Not part of the product API — consumed by container orchestrators, load balancers, and
metrics scrapers, never by the frontend. All public, all excluded from the global rate
limit (`@SkipThrottle()`), all excluded from per-request access logging (too frequent to be
useful log volume).

| Method | Path | Notes |
|---|---|---|
| GET | `/live` | Liveness — no dependency checks, always 200 if the process can respond at all. |
| GET | `/ready` | Readiness — 200 only if Postgres (and Redis, if configured) respond to a live ping; 503 otherwise. |
| GET | `/health` | Same checks as `/ready` plus process memory (heap/RSS) thresholds — for dashboards/manual checks, not orchestrator probes. |
| GET | `/metrics` | Prometheus-format text: default Node process metrics plus `http_requests_total`/`http_request_duration_seconds`, labeled by matched route *pattern* (never a raw URL). |

## Error shape

Every error response (see `src/common/filters/all-exceptions.filter.ts`):

```json
{
  "statusCode": 400,
  "message": "human-readable message or array of validation messages",
  "error": "Bad Request",
  "path": "/auth/register",
  "timestamp": "2026-01-01T00:00:00.000Z",
  "requestId": "b3f1e2a4-....-....-....-............"
}
```

5xx responses always use the generic message `"An unexpected error occurred."` — never a
stack trace or internal detail — regardless of the underlying cause. `requestId` matches
the `X-Request-Id` response header and the structured log line for that request (see
`SECURITY_NOTES.md`'s "Logging" section) — quote it when reporting a bug.

## Pagination shape

Endpoints returning a list (e.g. `GET /users`, `GET /reports`) accept `page`, `pageSize`
(max 100), and `sortDir` query params and return:

```json
{ "items": [...], "page": 1, "pageSize": 20, "total": 42, "totalPages": 3 }
```
