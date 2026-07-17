# Ember Backend — Changelog

## Phase 1 — Real Backend Foundation (initial)

**Added**

- NestJS backend (`backend/`) with Clean Architecture-style module separation: `auth`,
  `users`, `profiles`, `matching`, `messaging`, `safety`, `audit`, `integrations`, plus
  shared `common/` and `config/` infrastructure.
- PostgreSQL schema via Prisma (`backend/prisma/schema.prisma`) covering Users, RBAC
  (Roles/Permissions), Profiles/Photos/Preferences/PromptAnswers, Matching (Likes/Matches),
  Messaging (Conversations/Messages), Safety (Reports/Blocks/ModerationCases), AuditLog,
  Subscriptions, Notifications, Sessions/RefreshTokens.
- Self-hosted authentication: Argon2id password hashing, JWT access tokens, rotating
  opaque refresh tokens with reuse detection, anti-enumeration login responses (see
  `OPEN_DECISIONS.md` D-01 for why this is self-hosted rather than delegated to a
  managed provider).
- RBAC with two enforcement layers: role-based (`@Roles`) and fine-grained
  permission-based (`@RequirePermissions`, checked live against the database).
- Safety foundation: Reports (auto-aggregating into ModerationCases), Blocks (enforced
  in both matching and messaging), ModerationCases (assign/resolve, with BANNED/SUSPENDED
  resolutions immediately revoking the subject's sessions), append-only AuditLog.
- Matching: like/pass/super-like recording, automatic Match + Conversation creation on
  reciprocal likes, block-aware.
- Messaging: send/list within a matched conversation, block-aware even post-match.
- Extension-point interfaces + DI-wired "NotConfigured" adapters (each throwing a clear,
  typed error rather than silently succeeding) for every third-party integration named in
  the product brief: Stripe, Twilio, email, AWS S3, identity verification, OpenAI/Anthropic,
  push notifications, analytics.
- Docker (multi-stage, non-root runtime user) + Docker Compose (Postgres + API).
- GitHub Actions CI (`.github/workflows/backend-ci.yml`): lint, migrate, seed, build,
  unit tests, e2e tests, Docker image build — against a real Postgres service container.
- 39 tests (10 unit, 29 e2e), all passing against a real local PostgreSQL instance.
- Documentation: this file, `OPEN_DECISIONS.md`, `API.md`, `SECURITY_NOTES.md`,
  `DEPLOYMENT.md`, `TESTING.md`, and updates to the existing `ARCHITECTURE.md` /
  `DATABASE_SCHEMA.md` planning documents to reflect what was actually built.

**Known gaps** (see `OPEN_DECISIONS.md` for the full list with rationale)

- No admin API to grant roles (done via direct database access during development).
- No real object storage — photo endpoints accept a client-supplied storage key rather
  than issuing a real presigned upload.
- Audit log is append-only at the application layer only; database-role-level enforcement
  (a separate migration role vs. runtime role) is not yet configured.
- `docker compose up` was validated syntactically (`docker compose config`) but not run
  to completion end-to-end in the sandbox this was built in, due to that environment's
  network policy blocking the Docker Hub registry — not a defect in the compose file.
