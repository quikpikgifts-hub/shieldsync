# Ember Backend — Release Process

**Status:** describes the workflow now that CI/CD exists
(`.github/workflows/backend-deploy.yml`) — it does not mean a production target exists yet.
See `DEPLOYMENT.md` for what's still missing before a real deploy can happen.

## What happens on every push to `main`

1. `backend-ci.yml` runs first (lint, `npm audit --omit=dev`, build, unit tests, e2e tests,
   a Docker build sanity check) — this is the same workflow that gates every branch/PR, not
   a separate path.
2. `backend-deploy.yml` builds the production Docker image and pushes it to GitHub
   Container Registry, tagged with both the full commit SHA and the branch name. The SHA
   tag is the one that matters for rollback — it's immutable and unambiguous.
3. `npx prisma migrate deploy` runs against `PRODUCTION_DATABASE_URL` (a GitHub Environment
   secret — not yet configured, since no production database exists).
4. The final "deploy" step is a placeholder (see the workflow file's own comment) until a
   real hosting target is chosen — it prints the image reference and exits successfully
   rather than guessing at a specific cloud provider's deploy API.

## Versioning

Images are tagged by full commit SHA (`ghcr.io/.../ember-backend:<sha>`), not semver — this
is a single internal service with one deployment target (once one exists), not a published
library. If external consumers of the API ever exist, revisit `API_AUDIT.md`'s note on API
versioning at that point; it's a different kind of "version" than the image tag.

## Rollback

**The image itself:** every commit's image is retained in GHCR (tagged by SHA), so rolling
back the *application code* is: re-run `backend-deploy.yml` via `workflow_dispatch`, setting
`image_tag` to the previous known-good commit SHA. This skips the build step and redeploys
the already-built image.

**The database migration is the part that needs actual judgment, not just a button press:**

- If the rollback commit's schema is *identical* to what's currently deployed (the bug
  being rolled back was application-logic-only, no migration involved), redeploying the old
  image is safe and complete on its own.
- If a migration *was* part of what's being rolled back, `prisma migrate deploy` is
  forward-only — it does not have a built-in "undo." Before rolling back the image:
  1. Check whether the migration was purely additive (new nullable column, new table, new
     index) — if so, the *old* application code will simply ignore the new
     column/table/index, and no migration-level rollback is needed at all.
  2. If the migration was destructive or backward-incompatible (dropped/renamed a column,
     changed a type, added a `NOT NULL` without a default), a hand-written *compensating*
     migration is required before the old code can run against the new schema safely — write
     and test this before rolling back the application, not after production is already
     broken.
  3. When in doubt, restore from a recent database backup instead of attempting to hand-roll
     a schema reversal under pressure — see `PRODUCTION_READINESS.md`'s backup-policy gap;
     this option isn't available until that's actually configured for wherever this is
     deployed.

**What to check after any rollback:** `GET /health` (not just `/ready`) on the redeployed
instance, and the audit log for the rollback window (`AuditLog` — every `auth.*`,
`moderation.*`, and `report.*` action during the incident should still be intact and
attributable, since `AuditLog` rows are never touched by a code rollback).

## Environments

Only one GitHub Environment (`production`) is referenced by the deploy workflow today. A
`staging` environment/workflow is straightforward to add (duplicate the job, point at a
different `DATABASE_URL` secret and image tag) once there's a second real target to deploy
to — not added speculatively ahead of that.
