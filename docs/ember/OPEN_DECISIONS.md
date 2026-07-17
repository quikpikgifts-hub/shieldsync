# Ember Backend — Open Decisions

Every assumption made to keep Phase 1 moving without waiting on external confirmation,
per the development policy: "when a requirement is undecided, implement the solution
using configurable settings, dependency injection, or feature flags where appropriate,
and document it here."

Each entry: what was assumed, why, the impact, and what needs future confirmation.

---

## D-01: Self-hosted authentication instead of Auth0/Clerk

**Assumption:** Built a real, self-hosted JWT + Argon2id auth system (`src/auth/`)
rather than delegating to a managed identity provider.

**Why:** `docs/ember/ARCHITECTURE.md` (written before this backend existed) recommended
delegating auth to Auth0/Clerk specifically so identity — the single highest-consequence
thing to get wrong — wouldn't be hand-rolled. That recommendation assumed real vendor
credentials would be available. None exist in this environment, and the instruction for
this phase was explicit: no mock auth, no placeholder backend, everything must execute
locally. Building a real self-hosted system was the only way to satisfy both constraints
at once.

**Impact:** The implementation is real and tested (argon2id hashing, rotating refresh
tokens with reuse detection, RBAC) — not a shortcut. But it is a different architecture
than originally planned, and it means Ember now owns credential storage risk directly
rather than delegating it to a vendor with a dedicated security team.

**Needs confirmation:** Whether to migrate to a managed provider before real users are
onboarded, or to keep the self-hosted system and invest in its hardening (rate limiting
is in place; a real pentest of this specific module is not). This is a decision for
whoever owns the security posture of the real product, not something to default silently.

---

## D-02: Self-attested date of birth as the only age gate

**Assumption:** `POST /auth/register` rejects anyone under 18 based on a self-reported
`dateOfBirth` field. No ID-based age verification exists yet.

**Why:** `THREAT_MODEL.md` (R-01) and `ROADMAP.md` Phase 0 already flagged this as an
open decision requiring product/legal sign-off before launch. Phase 1's job was to build
*something* enforceable rather than nothing, and to leave the door open for a stronger
check later — not to make the launch-readiness call itself.

**Impact:** This is a known-weak control. A minor (or an adult misrepresenting their age)
can trivially bypass it. This must not be treated as sufficient for a real launch.

**Needs confirmation:** The real age-assurance mechanism (ID-based verification via the
`IdentityVerificationProvider` extension point, a third-party age-estimation service, or
something else) — a product/legal decision, tracked as still open.

---

## D-03: Role assignment has no admin API yet

**Assumption:** New users get the `user` role automatically at registration. There is no
endpoint to promote a user to `moderator`/`admin`/`support` — it was done via a direct
database write during manual testing (see the smoke-test session) and via a Prisma call
in test helpers (`test/safety.e2e-spec.ts`).

**Why:** Building a safe, audited "grant this user a role" endpoint is itself a
privilege-escalation-sensitive feature that deserves its own careful design (who can grant
which roles to whom, with what approval, logged how) rather than being a rushed afterthought
inside this pass.

**Impact:** There is currently no in-product way to create a moderator or admin account
short of direct database access. This is fine for local development; it is a blocker for
any real deployment.

**Needs confirmation:** Design of the role-grant flow — likely an admin-only endpoint
gated by `RequirePermissions("users.role_change")`, itself only grantable outside the
running application (e.g. via a one-time seed of the first admin account).

---

## D-04: Audit log is append-only at the application layer, not yet at the database layer

**Assumption:** `AuditService` exposes no update/delete method, so the application code
can only ever insert audit rows.

**Why:** True tamper-resistance also requires revoking `UPDATE`/`DELETE` grants on
`audit_logs` for the database role the running application uses — but Prisma's migration
workflow (`prisma migrate dev`/`deploy`) needs a role with full DDL/DML privileges to run
migrations, and this local setup uses one Postgres role (`ember`) for both migrations and
runtime queries.

**Impact:** A compromise of the application's own database credentials (not just its code)
could still allow tampering with audit history — a real gap, not a theoretical one.

**Needs confirmation:** Before production, split into two Postgres roles: a migration
role with DDL privileges (used only during deploy) and a runtime role with DML privileges
that explicitly excludes `UPDATE`/`DELETE` on `audit_logs`. Tracked in `SECURITY_NOTES.md`.

---

## D-05: Photo/voice/video storage has no real object-storage backend

**Assumption:** `POST /profiles/me/photos` accepts a client-supplied `storageKey` string
directly, rather than issuing a real presigned upload URL. The `StorageProvider`
interface and its `NotConfigured` adapter exist (`src/integrations/storage/`), but no
real S3 adapter has been written.

**Why:** No AWS credentials exist in this environment; the extension-point pattern
(interface + DI token + NotConfigured adapter) was built per instruction rather than
faking a working upload flow.

**Impact:** Nothing today actually stores or serves an image. The photo-moderation
workflow (pending → approved/rejected) is real and tested, but it's moderating a string,
not a real file.

**Needs confirmation:** Which storage vendor/region, and the real presigned-upload flow —
tracked as a Phase 1 follow-up once AWS credentials exist.

---

## D-06: Reciprocal "Pass" does not currently unmatch or block

**Assumption:** `Like.action = PASS` is recorded but does not, by itself, prevent a future
`LIKE` from either party, and there's no explicit "unmatch" endpoint yet — `Match.unmatchedAt`
exists in the schema but nothing sets it.

**Why:** Out of scope for the initial matching/messaging vertical slice; the schema was
built to support it (so this isn't a redesign later), but the service-layer logic wasn't
built in this pass.

**Impact:** Minor product gap, not a safety gap — blocking (which *is* fully implemented)
is the actual safety-relevant control here, not unmatching.

**Needs confirmation:** None blocking — this is straightforward follow-up work, not a
decision that needs product/legal sign-off.

---

## D-07: Access token in memory, refresh token in `localStorage`

**Assumption:** The frontend (`src/emberApi.js`) keeps the access token only in a
module-level JS variable and persists the refresh token in `localStorage`, with a
session-restore attempt on app load.

**Why:** A dating app's frontend is a plain SPA with no server-rendered session layer, so
some persisted client-side token is unavoidable if reloading the page shouldn't force a
fresh login. Keeping the short-lived access token out of persistent storage limits what
a `localStorage`-reading XSS bug could steal to the long-lived refresh token, which is at
least revocable server-side (and rotation + reuse detection, `SECURITY_NOTES.md`, means a
stolen-and-reused refresh token is detected, not just eventually expired).

**Impact:** `localStorage` is still readable by any script that gets XSS access — this is
a real, known-weaker-than-ideal pattern compared to an httpOnly-cookie-based refresh flow.

**Needs confirmation:** Whether to move to httpOnly cookies before real users are
onboarded — this changes the CORS/CSRF story (cookies need `SameSite`/CSRF-token handling
that a pure Bearer-token API doesn't) and is a deliberate architecture tradeoff, not a
default to make silently.

---

## D-08: No compatibility score anywhere in the real product

**Assumption:** `GET /matching/candidates` returns no numeric compatibility score, and
the frontend match cards were changed to not display one (the client-only prototype
before this session showed a fabricated percentage).

**Why:** There is no real scoring algorithm (see `ROADMAP.md` Phase 3 — AI-driven
compatibility scoring is intentionally a later phase, built on top of a working safety
foundation). Showing a percentage without a real model behind it would be exactly the
"no placeholder functionality" violation the build policy rules out, even though it was
present in the pre-backend prototype.

**Impact:** The candidate cards are visually plainer than the original mock design —
tag (intent) and the person's own prompt answer are shown instead of a "92% match" badge.

**Needs confirmation:** None blocking. This is a deliberate, permanent removal, not a
placeholder gap — re-introduce a compatibility display only once Phase 3 has a real
scoring model behind it.

---

## D-09: No login screen existed until it was caught by testing the real multi-user flow

**Assumption (now fixed):** The frontend originally only had a registration flow. A
returning user with no persisted session (different browser, cleared storage) had no way
to authenticate against an existing account.

**Why this happened:** The original client-only prototype never needed a login screen —
every "session" was just in-memory React state with no real account behind it. Wiring to
a real backend surfaced this gap immediately: testing the actual asynchronous nature of
matching (create account A, create account B via the API, have B like A back later,
*then* check whether A's browser can discover the resulting match) required logging back
in as A in a fresh browser context, which had no UI path.

**Resolution:** Added a dedicated login screen (`Signup` component's `mode="login"`
branch) reachable from the landing page nav and from the signup screen itself.

**Needs confirmation:** None — this is now built, not still open. Recorded here as the
concrete example of why testing the real multi-user flow (not just a single happy path)
matters for a product in this category.

---

## D-10: "Your matches" list was missing until the same async-testing pass caught it

**Assumption (now fixed):** `GET /matching/matches` existed on the backend from Phase 1,
but nothing in the frontend ever called it — the UI only ever navigated to a chat at the
exact moment a mutual like happened live, in the same session.

**Why this happened:** In the real product, matches usually complete asynchronously (you
like someone; they like you back hours later, in a different session). The original
wiring pass missed this because the happy-path test (both sides act within one script)
never exercises the "discover an already-existing match on a later visit" path.

**Resolution:** The Matches screen now also fetches `listMatches()`, hydrates each with
the other person's profile via `GET /profiles/:userId`, and renders a clickable "Your
matches" strip that opens the real conversation.

**Needs confirmation:** None — built and verified with two independent real accounts
(one matched the other via a direct API call while the first account's browser session
was closed, then reopened and correctly discovered the match on the next visit).
