# Ember — API Reference (Condensed)

Full detail (request/response shapes, every edge case): `../API.md`. This is the endpoint
inventory — every route in the real application, verified matching the controllers exactly
(zero drift, confirmed during RC-1's code-quality scan and re-confirmed in
`../PRE_LAUNCH_AUDIT.md`).

## Auth (`/auth`)

| Method | Path | Auth | Rate limit |
|---|---|---|---|
| POST | `/auth/register` | Public | 5/min/IP |
| POST | `/auth/login` | Public | 5/min/IP + per-account lockout |
| POST | `/auth/refresh` | Public | — |
| POST | `/auth/logout` | Authenticated | — |
| POST | `/auth/email/verification/request` | Authenticated | 5/min/IP |
| POST | `/auth/email/verification/confirm` | Public | — |
| POST | `/auth/password-reset/request` | Public | 5/min/IP + 3/hour/email |
| POST | `/auth/password-reset/confirm` | Public | — |

## Users (`/users`)

| Method | Path | Auth |
|---|---|---|
| GET | `/users/me` | Authenticated |
| GET | `/users` | `users.read` permission |
| GET | `/users/:id` | `users.read` permission |

## Profiles (`/profiles`)

| Method | Path | Auth |
|---|---|---|
| GET / PUT | `/profiles/me` | Authenticated |
| GET / PUT | `/profiles/me/preferences` | Authenticated |
| PUT | `/profiles/me/prompt-answers` | Authenticated |
| POST | `/profiles/me/photos/upload-url` | Authenticated |
| POST | `/profiles/me/photos` | Authenticated (ownership-validated — RC-1 fix) |
| DELETE | `/profiles/me/photos/:photoId` | Authenticated, owner only |
| PATCH | `/profiles/photos/:photoId/moderation` | `moderation.resolve` permission |
| GET | `/profiles/:userId` | Authenticated |

## Matching (`/matching`)

| Method | Path | Auth |
|---|---|---|
| GET | `/matching/candidates` | Authenticated |
| POST | `/matching/likes` | Authenticated |
| GET | `/matching/matches` | Authenticated |
| GET | `/matching/likes/received` | Authenticated |

## Messaging (`/conversations`)

| Method | Path | Auth |
|---|---|---|
| GET | `/conversations/:matchId/messages` | Authenticated, match member only |
| POST | `/conversations/:matchId/messages` | Authenticated, match member only |

## Safety (`/reports`, `/blocks`, `/moderation-cases`)

| Method | Path | Auth |
|---|---|---|
| POST | `/reports` | Authenticated |
| GET | `/reports/me` | Authenticated |
| GET | `/reports` | `reports.read` permission |
| PATCH | `/reports/:id/resolve` | `reports.resolve` permission |
| POST | `/blocks` | Authenticated |
| GET | `/blocks` | Authenticated |
| DELETE | `/blocks/:blockedId` | Authenticated |
| GET | `/moderation-cases` | `reports.read` permission |
| PATCH | `/moderation-cases/:id/assign` | `moderation.assign` permission |
| PATCH | `/moderation-cases/:id/resolve` | `moderation.resolve` permission |

## Operational (no auth)

| Method | Path | Purpose |
|---|---|---|
| GET | `/live` | Liveness — process is up |
| GET | `/ready` | Readiness — Postgres/Redis reachable |
| GET | `/health` | Same as `/ready` + memory thresholds |
| GET | `/metrics` | Prometheus-format metrics |

## Notes for API consumers

- Every non-`@Public()` route requires a valid `Authorization: Bearer <token>` header —
  protection is default-on, not opt-in.
- Every list endpoint that can grow unbounded is paginated (`{items, page, pageSize, total,
  totalPages}`), except `/matching/matches` and `/matching/candidates`, which return bare
  arrays — check `../API.md` per-endpoint if writing a new client.
- Photo responses never include the raw storage key — only a short-lived signed `url`/
  `thumbnailUrl` (RC-1 security fix).
