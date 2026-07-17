# Ember Backend — Database Audit

**Scope:** `backend/prisma/schema.prisma` (23 models/enums, single migration
`20260717010957_init`), read in full and checked model-by-model against every service that
queries it. No changes were made to the schema or migrations in this pass — see "Recommended
schema changes" for why these are batched as future work rather than applied now.

## Indexes

| Table | Indexed on | Assessment |
|---|---|---|
| `users` | `id` (PK), `email` (unique), `phone` (unique), `status` | Adequate for current query patterns (`findUnique` by id/email, filter by status). |
| `sessions` | `id` (PK), `userId` | Adequate. |
| `refresh_tokens` | `id` (PK), `tokenHash` (unique), `userId`, `expiresAt` | Adequate. `expiresAt` index supports a future cleanup job (none exists yet — see Informational). |
| `profiles` | `userId` (PK, also the FK) | Adequate — 1:1 with `users`. |
| `photos` | `id` (PK), `profileId` | Adequate for "list a profile's photos." |
| `prompt_answers` | `id` (PK), unique `[profileId, promptKey]` | Adequate. |
| `preferences` | `userId` (PK) | Adequate. |
| `likes` | `id` (PK), unique `[actorId, targetId]`, `[targetId, action]` | The unique index's leftmost column (`actorId`) also serves `WHERE actorId = ?` lookups (`listCandidates`'s "already decided" query), so no separate `actorId` index is needed. Good. |
| `matches` | `id` (PK), unique `[userAId, userBId]`, `userBId` | **Gap:** see "Match pair ordering isn't DB-enforced" below. |
| `conversations` | `id` (PK), `matchId` (unique) | Adequate. |
| `messages` | `id` (PK), `[conversationId, sentAt]` | Adequate for "list messages in a conversation, newest/oldest first." |
| `reports` | `id` (PK), `[status, createdAt]`, `subjectId` | Adequate. |
| `blocks` | `id` (PK), unique `[blockerId, blockedId]` | **Gap:** see "Block reverse-lookup has no supporting index" below. |
| `moderation_cases` | `id` (PK), `status`, `subjectId` | Adequate. |
| `audit_logs` | `id` (PK), `actorId`, `[action, createdAt]` | **Gap:** no index on `subjectId` — see below. |
| `subscriptions` | `id` (PK), `userId` | Adequate (not yet queried by real code — Stripe integration is a `NotConfigured*` stub). |
| `notifications` | `id` (PK), `[userId, readAt]` | Adequate (not yet queried by real code). |

### Finding DB-1 (Medium): Block reverse-lookup has no supporting index

`BlocksService.isBlocked()` and every block-aware query in `matching.service.ts`/`messaging.service.ts`
query blocks with `OR: [{blockerId: A, blockedId: B}, {blockerId: B, blockedId: A}]`. The unique
index on `[blockerId, blockedId]` serves the first half of that OR (and any query filtered by
`blockerId` alone, via the index's leftmost-column property) but the second half — "who has
blocked *me*" (`blockedId = ?`) — has no supporting index and forces a sequential scan of the
`blocks` table. This is called on nearly every matching/messaging/candidate-listing request.

**Recommendation:** add `@@index([blockedId])` to the `Block` model in the next migration.

### Finding DB-2 (Low): `AuditLog.subjectId` has no index

`AuditLog` is indexed on `actorId` and `[action, createdAt]`, but not on `subjectId`. "Show me the
full audit history for this specific account" (the natural moderator-tooling query, and exactly
what M-3 in `SECURITY_AUDIT.md`'s new `profile.pii_view` entries would be looked up by) has no
supporting index today.

**Recommendation:** add `@@index([subjectId])` to `AuditLog` in the next migration.

### Finding DB-3 (Low, forward-looking): No trigram index for substring email search

`UsersService.list()`'s `email: { contains, mode: "insensitive" }` filter compiles to
`ILIKE '%...%'`, which cannot use the existing B-tree unique index on `email` and sequential-scans
the table. Immaterial at current scale; becomes a real cost once the `users` table is large.

**Recommendation:** when this becomes measurably slow (not preemptively — see
`ARCHITECTURE.md` §2's stated philosophy on not over-engineering for scale that doesn't exist
yet), enable the `pg_trgm` extension and add a GIN trigram index on `email`.

## Foreign keys & cascade rules

Every relation was checked for its `onDelete` behavior. The schema's own design-note header
states the intended policy: soft-delete (`deletedAt`) for `Users`/`Profile`/`Message` so
dependent records survive a user-facing "delete," hard-delete-with-cascade elsewhere.

### Finding DB-4 (High): `Report` and `ModerationCase` cascade-delete on the subject user, destroying safety/evidence records

`Report.subjectId` → `Users` is `onDelete: Cascade`, and so is `ModerationCase.subjectId` →
`Users`. **If a user row is ever hard-deleted** — which is explicitly planned future work per
`ROADMAP.md` Phase 1 ("Automated data-export and account-deletion workflows... not yet built") —
every report ever filed *about* that person, and every moderation case opened about them
(including its `notes`, `action`, and resolution history), is deleted along with them.

This directly undermines the product's own safety model: a user could be reported multiple times,
banned, and then (once account-deletion exists) delete their own account or have it deleted as
part of a "right to erasure" flow — silently erasing the evidence trail that justified the ban.
Contrast this with `AuditLog.actorId` → `Users`, which is correctly `onDelete: SetNull` (the log
entry survives; only the actor reference is nulled) — the schema is internally inconsistent about
which safety-relevant records must survive a user's deletion and which don't.

Note this is **not yet exploitable** — there is no hard-delete code path anywhere in the current
application (`Users` rows are only ever soft-deleted today). This is flagged now because it is a
schema decision that must be made correctly *before* an account-deletion feature is built, not
discovered after the fact when real deletions are already happening.

**Recommendation:** change `Report.subjectId`, `Report.reporterId`, `ModerationCase.subjectId`,
and `ModerationCase.assigneeId` from `onDelete: Cascade` to `onDelete: Restrict` (block the
user-delete until the safety records are explicitly retained/anonymized by whatever
account-deletion workflow gets built) or `onDelete: SetNull` (mirroring `AuditLog`'s pattern,
if the record should survive with the identity reference cleared). This should be resolved as
part of designing the account-deletion feature in `ROADMAP.md` Phase 1, not deferred past it.

### Finding DB-5 (Low): Match-pair canonical ordering isn't enforced by the database

`Match.@@unique([userAId, userBId])` combined with `MatchingService`'s `orderPair()` helper
(`a < b ? [a,b] : [b,a]`) is how the schema avoids storing both `(A,B)` and `(B,A)` as separate
rows for the same pair — but this invariant is enforced entirely by application-layer discipline.
Any future code path that creates a `Match` without going through `orderPair()` (a direct
Prisma call in a script, a future admin tool, a bugged refactor) could insert a duplicate,
un-deduplicated match for the same pair in the opposite order, and the unique constraint would
not catch it.

**Recommendation:** a `CHECK ("userAId" < "userBId")` constraint (added via a raw-SQL migration
step, since Prisma's schema DSL doesn't express cross-column checks) would make the invariant
impossible to violate regardless of which code path creates the row. Low priority given
`orderPair()` is currently the only creation path and is well-covered by
`matching.e2e-spec.ts`.

### Finding DB-6 (Low): No DB-level "one primary photo per profile" constraint

Referenced in `SECURITY_AUDIT.md` L-3. `Photo.isPrimary` has no partial unique index
(`CREATE UNIQUE INDEX ... WHERE is_primary` in Postgres terms), so the invariant "at most one
primary photo per profile" is enforced only by `ProfilesService.addPhoto()`'s
un-transacted `updateMany`-then-`create` sequence, which has a known race window.

**Recommendation:** batch with DB-1/DB-2 in the next migration.

## Unique constraints

All confirmed correct and sufficient for their purpose: `Users.email`, `Users.phone`,
`RefreshToken.tokenHash`, `Like.[actorId, targetId]`, `Match.[userAId, userBId]`,
`Conversation.matchId`, `PromptAnswer.[profileId, promptKey]`, `Block.[blockerId, blockedId]`,
`Role.key`, `Permission.key`. No missing unique constraint was found anywhere in the schema.

## Normalization

The schema is in 3NF throughout — no repeating groups, no denormalized derived columns (age is
correctly *never* stored, only computed from `dateOfBirth` on read, which is also a privacy-by-design
choice: exact birth date is more identifying than age-in-years and is never returned to anyone but
the account owner — see `common/utils/age.util.ts`'s doc comment). `Preferences.seekingGenders` is
a Postgres text array rather than a join table to a `Gender` lookup table — a deliberate,
reasonable tradeoff for a small, free-form, non-relational list (confirmed via the schema's own
comment: "free-form list, validated at the application layer").

## Migration quality

Only one migration exists (`20260717010957_init`, 457 lines) — expected for a project at this
stage; there is no migration *history* to audit for issues like non-concurrent index builds on an
already-populated table, since no table has ever had production data. Noted for future migrations
(DB-1, DB-2, DB-4, DB-5, DB-6 above will be the first non-init migration): once any table has
meaningful row counts, prefer `CREATE INDEX CONCURRENTLY` (requires running each index-adding
statement outside a transaction, which needs `prisma migrate`'s `--create-only` flag plus manual
editing of the generated SQL) over Prisma's default transactional migration wrapping, to avoid
locking the table for the duration of the index build.

## Connection / pool configuration

`PrismaService` (`src/prisma/prisma.service.ts`) uses `PrismaClient`'s defaults for connection
pooling — no explicit `connection_limit` or `pool_timeout` is set via the `DATABASE_URL` query
string or client options. Prisma's default pool size (`num_cpus * 2 + 1`) is a reasonable
starting point for a single-instance deployment but should be revisited once running multiple API
instances against one Postgres instance, since each instance opens its own pool independently
(the total connection count is `instances × pool_size`, and Postgres's own `max_connections`
default is 100). Tracked in `PRODUCTION_READINESS.md`.

## Summary

| ID | Severity | Status |
|---|---|---|
| DB-4 | High | Documented — must be resolved before any account-deletion feature ships |
| DB-1 | Medium | Recommended (add index, next migration) |
| DB-2 | Low | Recommended (add index, next migration) |
| DB-3 | Low | Recommended (trigram index, only once it's measurably slow) |
| DB-5 | Low | Recommended (CHECK constraint, next migration) |
| DB-6 | Low | Recommended (partial unique index, next migration) |

No schema/migration changes were applied in this pass — every finding above is additive (new
indexes/constraints) rather than corrective of a currently-wrong value, so batching them into one
deliberate migration (rather than six incremental ones) is the right sequencing, and none of them
block alpha on their own except DB-4, which blocks a *future* feature (account deletion), not
current alpha functionality.
