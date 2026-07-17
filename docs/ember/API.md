# Ember Backend — API Reference

Narrative overview. The authoritative, always-current reference is the live OpenAPI
document at `GET /docs` when running the server (disabled in `NODE_ENV=production` — see
`src/configure-app.ts`) — this file exists so the API shape can be read without running
the server, and won't always be perfectly in sync with it.

All endpoints are prefixed with nothing (routes are mounted at the app root, e.g.
`http://localhost:3001/auth/register`). All authenticated endpoints expect
`Authorization: Bearer <accessToken>`.

## Auth (`src/auth/`) — public except `/auth/logout`

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/auth/register` | Public | Creates an account, returns `{ user, tokens }`. Rejects under-18 (self-attested DOB), weak passwords, duplicate emails. |
| POST | `/auth/login` | Public | Rate-limited to 5/min. Returns `{ user, tokens }`. Generic error for both wrong password and nonexistent account. |
| POST | `/auth/refresh` | Public | Body: `{ refreshToken }`. Rotates to a new pair. Reuse of an already-rotated token revokes the whole session. |
| POST | `/auth/logout` | Authenticated | Body: `{ refreshToken }`. Revokes that session. Idempotent. |

## Users (`src/users/`)

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/users/me` | Authenticated | Own account record (never includes `passwordHash`). |
| GET | `/users` | `users.read` permission | Paginated, filterable by `status`/`email`. |
| GET | `/users/:id` | `users.read` permission | Another user's account record. |

## Profiles (`src/profiles/`)

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET / PUT | `/profiles/me` | Authenticated | Own profile (`PUT` upserts). |
| GET / PUT | `/profiles/me/preferences` | Authenticated | Match preferences (age range, distance, etc). |
| POST | `/profiles/me/photos` | Authenticated | Registers a `storageKey` (see D-05 in `OPEN_DECISIONS.md` — no real upload yet). Always starts `PENDING` moderation. |
| DELETE | `/profiles/me/photos/:photoId` | Authenticated (owner only) | |
| PATCH | `/profiles/photos/:photoId/moderation` | `moderation.resolve` permission | Approve/reject a photo. |
| GET | `/profiles/:userId` | Authenticated | Public view of another profile. Returns 404 (not 403) if blocked, to avoid revealing block state. |

## Matching (`src/matching/`)

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/matching/likes` | Authenticated | Body: `{ targetId, action: LIKE\|PASS\|SUPER_LIKE }`. Creates a `Match` + `Conversation` automatically when both parties have liked/super-liked each other. Blocked pairs get 403. |
| GET | `/matching/matches` | Authenticated | Own active matches. |
| GET | `/matching/likes/received` | Authenticated | Who has liked the caller (excludes anyone blocked in either direction). |

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

## Error shape

Every error response (see `src/common/filters/all-exceptions.filter.ts`):

```json
{
  "statusCode": 400,
  "message": "human-readable message or array of validation messages",
  "error": "Bad Request",
  "path": "/auth/register",
  "timestamp": "2026-01-01T00:00:00.000Z"
}
```

5xx responses always use the generic message `"An unexpected error occurred."` — never a
stack trace or internal detail — regardless of the underlying cause.

## Pagination shape

Endpoints returning a list (e.g. `GET /users`, `GET /reports`) accept `page`, `pageSize`
(max 100), and `sortDir` query params and return:

```json
{ "items": [...], "page": 1, "pageSize": 20, "total": 42, "totalPages": 3 }
```
