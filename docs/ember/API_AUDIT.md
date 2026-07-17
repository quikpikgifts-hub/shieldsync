# Ember Backend — API Audit

**Scope:** every controller in `backend/src/**/*.controller.ts` (9 controllers, ~30 routes),
cross-referenced against `docs/ember/API.md` and the live route table in `app.module.ts`.

## Authentication & authorization consistency

| Route | Auth | Authz | Verified |
|---|---|---|---|
| `POST /auth/register` | `@Public()` | — | ✅ |
| `POST /auth/login` | `@Public()`, 5/min throttle | — | ✅ |
| `POST /auth/refresh` | `@Public()` | — | ✅ |
| `POST /auth/logout` | Required (was implicit — now explicit `@ApiBearerAuth()`) | Caller must own the session (fixed — `SECURITY_AUDIT.md` M-6) | ✅ |
| `GET /users/me` | Required | Self only | ✅ |
| `GET /users` | Required | `users.read` | ✅ |
| `GET /users/:id` | Required | `users.read` | ✅ (now audited — M-3) |
| `GET/PUT /profiles/me*` | Required | Self only | ✅ |
| `POST /profiles/me/photos` | Required | Self only | ✅ |
| `DELETE /profiles/me/photos/:photoId` | Required | Owner-checked in service (`photo.profileId !== userId` → 404) | ✅ |
| `PATCH /profiles/photos/:photoId/moderation` | Required | `moderation.resolve` | ✅ |
| `GET /profiles/:userId` | Required | Any authenticated user, block-aware | ✅ |
| `GET /matching/*`, `POST /matching/likes` | Required | Self-scoped | ✅ |
| `GET/POST /conversations/:matchId/messages` | Required | Match-membership checked in service | ✅ |
| `POST/GET /reports`, `GET /reports/me` | Required | Self-scoped or `reports.read`/`reports.resolve` | ✅ |
| `POST/GET/DELETE /blocks` | Required | Self-scoped | ✅ |
| `GET/PATCH /moderation-cases*` | Required | `reports.read`/`moderation.assign`/`moderation.resolve` | ✅ |

Every route was checked for the "secure by default" guarantee `JwtAuthGuard`'s doc comment
claims (global guard, `@Public()` opts out) — confirmed true: `grep -rn "@Public("` returns
exactly the four auth routes listed above and nothing else. No route is unintentionally open.

**Finding API-1 (informational, now fixed alongside SECURITY_AUDIT.md M-6):** `POST /auth/logout`
was already de facto authenticated (no `@Public()`), but lacked the `@ApiBearerAuth()` Swagger
annotation the other authenticated routes all carry, so the generated OpenAPI doc understated its
auth requirement. Fixed in the same edit as M-6.

## Input validation

The global `ValidationPipe` (`configure-app.ts`) is configured with
`whitelist: true, forbidNonWhitelisted: true, transform: true` — confirmed via
`auth.e2e-spec.ts`'s "rejects unknown fields on the DTO" test, which is a real assertion against
a running server, not just a config read. Every `@Body()`/`@Query()` parameter across all 9
controllers is typed to a class-validator DTO; none accept a raw untyped object.

DTO-level gaps found and fixed in this pass (full detail in `SECURITY_AUDIT.md` M-5):
missing `@IsNotEmpty()` on four required text fields, a Swagger/validation mismatch on
`UpsertProfileDto.displayName`, and missing array constraints on
`UpsertPreferencesDto.seekingGenders`.

**Finding API-2 (Medium, fixed):** no route parameter (`:id`, `:photoId`, `:userId`, `:matchId`,
`:reportId`, `:caseId`, `:blockedId`) was validated as a UUID before reaching the service layer.
Fixed via `ParseUUIDPipe` on every one of them (`SECURITY_AUDIT.md` M-4).

**Finding API-3 (Low, documented):** `ListUsersQueryDto`/`ListReportsQueryDto`'s `sortBy`/`status`
fields were specifically checked for Prisma `orderBy`-key injection (a real class of bug where an
unvalidated `sortBy` string is interpolated directly into an ORM's dynamic sort clause) and
confirmed **safe** — both use `@IsIn()` against a closed, hardcoded list of allowed field names.
This was verified as correct, not assumed; recorded here so a future reviewer doesn't have to
re-derive it.

## Response & error consistency

Every error response funnels through the single global `AllExceptionsFilter`, producing the
documented shape (`statusCode`, `message`, `error`, `path`, `timestamp`) for every 4xx/5xx across
every controller — confirmed by reading the filter and cross-checking that no controller has its
own local `try/catch` that reshapes an error response differently. 5xx responses always return the
generic `"An unexpected error occurred."` regardless of cause; no stack trace or internal error
detail was found leaking anywhere, including from Prisma errors (P2002, P2025, etc.) that reach
the filter unhandled — they're caught by the filter's default branch, not left to Express's
default handler.

**Finding API-4 (Low, documented, not fixed — see rationale):** the *shape* of error responses is
uniform, but the *specificity* is not: a Prisma `P2002` (unique violation) or `P2025` (record not
found) that reaches `AllExceptionsFilter` without being caught by the calling service first is
mapped to a generic 500 with the generic message, rather than a more specific 409/404. This was
deliberately fixed at the one call site where it was a real, confirmed bug (`MatchingService`'s
match-creation race — `SECURITY_AUDIT.md` M-2) but was not swept across every Prisma call site in
the codebase, because doing so exhaustively (auditing every `create`/`update`/`upsert` for which
specific Prisma error codes are reachable under concurrency, and adding bespoke handling for each)
is a larger, lower-urgency undertaking than the specific race condition that was fixed. No other
concurrent-write race was found during this audit's file-by-file review of every service, but a
dedicated pass explicitly looking for this pattern (rather than encountering it once) is
recommended before scaling to real concurrent traffic.

## HTTP status codes

Spot-checked against REST convention across all 30 routes: `201`/`200` for success (Nest's
default `200` is used even for `POST /auth/register`/`login` since they return a body — acceptable,
not a `201` violation since no `Location` header semantics apply), `204 No Content` correctly used
for `DELETE /blocks/:blockedId` and `POST /auth/logout`, `400` for validation failures, `401` for
authn failures, `403` for authz failures (block-related and `PermissionsGuard`), `404` for missing
resources, `409` for `POST /auth/register`'s duplicate-email case. No inconsistency found.

## Pagination, filtering, sorting

`PaginationQueryDto` (`common/dto/pagination-query.dto.ts`) is the single shared implementation
used by every list endpoint (`GET /users`, `GET /reports`, `GET /reports/me`,
`GET /moderation-cases`, `GET /conversations/:matchId/messages`) — page/pageSize (capped at 100)/
sortDir, returning `{items, page, pageSize, total, totalPages}`. Confirmed consistent across every
call site; no endpoint reimplements its own pagination logic.

**Finding API-5 (Informational):** `GET /matching/candidates` does *not* use
`PaginationQueryDto`'s `skip`/`take` against the database directly — it over-fetches a 200-row
pool and paginates in application code (documented, deliberate — see the code comment in
`MatchingService.listCandidates()`: age is derived from `dateOfBirth`, not a stored column, so it
can't be a direct SQL predicate without a schema change). This means its `total`/`totalPages`
semantics differ subtly from every other paginated endpoint (they reflect the 200-row pool, not
the true total candidate count) — worth calling out explicitly in `API.md` rather than leaving an
implicit inconsistency for API consumers to discover.

## Rate limiting

Global default (100 req/min, IP-keyed) applies to every route via `ThrottlerGuard`;
`POST /auth/login` overrides to 5/min. Both confirmed correctly wired in `app.module.ts`/
`auth.controller.ts`. The storage backend limitation (in-memory, not shared across instances) is
covered in `SECURITY_AUDIT.md` H-3 and not repeated here.

## API versioning

**Finding API-6 (Informational, documented):** there is no versioning strategy — no `/v1` prefix,
no `Accept`-header content negotiation, no version field anywhere. For a pre-alpha API with a
single first-party frontend client this is a reasonable simplification, not a defect, but it
should be decided (URL-prefix vs. header-based) before any external API consumer exists, since
retrofitting versioning onto an already-public API is significantly more disruptive than deciding
upfront. Tracked in `PRODUCTION_READINESS.md`.

## Summary

| ID | Severity | Status |
|---|---|---|
| API-2 | Medium | **Fixed** (same as `SECURITY_AUDIT.md` M-4) |
| API-4 | Low | Documented — fixed at the one confirmed race site, not swept globally |
| API-1 | Informational | **Fixed** (Swagger annotation) |
| API-3 | Informational | Verified safe, no action needed |
| API-5 | Informational | Documented (clarify in `API.md`) |
| API-6 | Informational | Documented (decide before external consumers exist) |
