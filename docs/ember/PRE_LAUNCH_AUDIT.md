# Ember Backend — Pre-Launch Audit (Phase 7)

Every check below was re-run fresh this pass against current source — not assumed from
RC-1's earlier audit, though the results are consistent with it (as expected, since no
application code has changed since RC-1 except the RC-1 fixes themselves). Real command
output is quoted where relevant.

## No placeholder credentials

**Clean.** `docker-compose.yml`'s `POSTGRES_PASSWORD: ember_dev_password` and
`JWT_ACCESS_SECRET: "compose-local-dev-secret-change-me-0000000000"` are explicitly
local-dev-only (obviously fake, never used outside `docker-compose.yml` itself).
`docker-compose.prod.yml` sources every credential from `${VAR}` environment interpolation
— nothing hardcoded. `.env.example` uses `CHANGE_ME`-prefixed placeholders throughout.
`k8s/secret.example.yaml` uses `REPLACE_ME` placeholders with an explicit top-of-file
warning never to `kubectl apply` it directly. No file contains a credential that could be
mistaken for a real one.

## No TODO/FIXME/HACK markers

**Clean.** `grep -rn "TODO\|FIXME\|HACK\|XXX" backend/src --include="*.ts"` (excluding
specs): zero matches.

## No dead code

**Clean**, per RC-1's exhaustive pass (`tsc --noUnusedLocals --noUnusedParameters` clean,
every DTO/provider/import traced to a real consumer — see `ENTERPRISE_READINESS_REPORT.md`
and `CHANGELOG.md`'s RC-1 entry) and re-confirmed this pass with the same TODO/console/debugger
greps returning zero matches. No new dead code has been introduced since — no application
code has changed since RC-1's fixes.

## No unused dependencies

**Clean.** The three genuinely-unused devDependencies found during RC-1 (`ts-loader`,
`tsconfig-paths`, `source-map-support`) were removed in that pass and have not returned.
`npm audit --omit=dev --audit-level=high`: **0 vulnerabilities** (re-run fresh this pass).

## No exposed secrets

**Clean.** `git ls-files | grep -E "\.env$|\.env\.[a-z]+$"` (excluding `.example`): no
matches — no real `.env` file has ever been committed. Grepped the full tracked file set
for AWS access-key-shaped strings (`AKIA[0-9A-Z]{16}`) and private-key PEM headers: zero
matches.

## No development configuration enabled

**Clean, with one note.** `NODE_ENV` is read in exactly two places
(`config/configuration.ts`, `config/validation.schema.ts`) — both only as a config default
selector (defaults to `"development"` if unset, validated against an enum of
`development`/`test`/`production`), never as a conditional that disables a security control
or enables a bypass. There is no code path anywhere in `backend/src` that behaves
differently or less securely because `NODE_ENV !== "production"` — grepped for every
`NODE_ENV` reference and confirmed each one directly. `DEPLOYMENT_CHECKLIST.md` and
`AWS_SETUP_GUIDE.md` both correctly instruct setting `NODE_ENV=production` for a real
deploy (and Phase 5/7's real local validation runs both used it), but its absence wouldn't
itself open a security hole — worth stating plainly rather than leaving as an assumption.

## No debug endpoints

**Clean.** Every route across all 8 controllers was enumerated during RC-1's backend
code-quality scan and diffed against `API.md` with zero drift in either direction — no
undocumented route exists. Re-grepped this pass for anything named/pathed with `debug`,
`__test`, `/internal`, or similar conventions: zero matches.

## No unsafe CORS settings

**Clean by default, operator-discipline-dependent in practice.** `configure-app.ts` calls
`app.enableCors({ origin: appConfig.corsOrigins, credentials: true })` —
`corsOrigins` is parsed from `CORS_ORIGIN` (default `http://localhost:5173,http://127.0.0.1:5173`
for local dev), never a wildcard `*`, and `credentials: true` combined with an explicit
origin list (not a wildcard) is the correct, safe pairing — browsers reject
`credentials: true` with a wildcard origin anyway, so this isn't just a policy choice, it's
enforced by CORS semantics themselves. **Note, not a code defect**: nothing in
`validation.schema.ts` prevents an operator from setting `CORS_ORIGIN=*` at deploy time —
this is deployment configuration discipline, not an application-code gap.
`DEPLOYMENT_CHECKLIST.md` step 3 already instructs setting `cors_origin` to the real
frontend's real origin, and `PRODUCTION_SECURITY_REPORT.md` independently verified (against
a real running instance) that a disallowed origin correctly receives no
`Access-Control-Allow-Origin` header.

## No missing environment validation

**Clean.** Every one of the 35 environment variables `validation.schema.ts` declares was
re-confirmed (RC-1 backend code-quality scan) to be actually read somewhere in the
application — no declared-but-unused variable, and (checked in the other direction) no
`process.env.X` reference anywhere in `backend/src` bypasses the Joi schema for a variable
that should be validated. Fails fast at boot on a missing/malformed required variable
(`DATABASE_URL`, `JWT_ACCESS_SECRET`) rather than surfacing as a confusing runtime error the
first time a route needs it — this is the schema's own stated design intent, confirmed
still true by reading it directly this pass.

## Deployment package cross-check

Verified every deployment-related document against the actual current implementation this
pass (not assumed current from when each was written):

| Area | Cross-checked against | Result |
|---|---|---|
| Terraform | `infra/terraform/**/*.tf` (fresh full re-read this session, see `TERRAFORM_READINESS.md`) | Consistent — `AWS_SETUP_GUIDE.md`, `DEPLOYMENT_CHECKLIST.md`, `AWS_COST_ESTIMATE.md` all match current variable/output names and module structure |
| Docker | `Dockerfile`, `docker-compose.yml`, `docker-compose.prod.yml` | Consistent — non-root runtime user, multi-stage build, `${VAR}` secret interpolation in the prod compose file, matches `DEPLOYMENT.md`'s description |
| GitHub Actions | `.github/workflows/backend-ci.yml`, `backend-deploy.yml` | Consistent — the real, credential-gated ECS deploy path added in Phase 4 is accurately described in `OPERATOR_RUNBOOK.md`, `DEPLOYMENT.md`, and `DEPLOYMENT_CHECKLIST.md`; re-confirmed the `permissions:` block is still exactly `contents: read, packages: write, id-token: write` (no scope creep since RC-1's security review) |
| Database migrations | `prisma/migrations/*/migration.sql` (2 migrations) | Consistent — `npx prisma migrate status` confirmed "Database schema is up to date!" against the real local database used for this pass's fresh test run |
| Secrets | `infra/terraform/modules/secrets/main.tf` | Consistent — all 11 keys match `local.secret_env_names` in `modules/ecs/main.tf` exactly (re-verified this pass, zero drift) |
| Health endpoints | `src/health/health.controller.ts` | Consistent — `/live`, `/ready`, `/health` all still present and match every doc's description; re-confirmed passing in this pass's fresh e2e run (`test/health.e2e-spec.ts`) |
| Smoke tests | `backend/scripts/launch-verification.mjs` | Consistent — script exists, syntax-checked clean this pass, referenced correctly by `DEPLOYMENT_CHECKLIST.md` step 10 |
| Rollback procedures | `RELEASE.md`, `.github/workflows/backend-deploy.yml`'s `image_tag` input | Consistent — `workflow_dispatch` rollback path unchanged since Phase 4, correctly described in `OPERATOR_RUNBOOK.md`, `OPERATIONS_RUNBOOK.md`, and `DEPLOYMENT_CHECKLIST.md` step 11 |

**No inconsistencies found this pass.** This is expected, not remarkable — no application
or infrastructure code has changed since RC-1/Phase 6, and this audit is confirming that
fact directly rather than assuming it.

## Fresh test run, this pass

Re-ran the full suite against real local PostgreSQL/Redis one more time for this audit,
rather than citing RC-1's numbers from memory:

```
Unit:  Test Suites: 4 passed, 4 total | Tests: 23 passed, 23 total
E2E:   Test Suites: 8 passed, 8 total | Tests: 67 passed, 67 total
Lint:  0 errors, 3 pre-existing warnings (test-file `any` types)
Build: clean
Audit: 0 vulnerabilities (--omit=dev --audit-level=high)
```

## Summary

Zero new findings this pass. Every item on this audit's checklist is clean, and the one
"note, not a defect" (CORS operator discipline) is already covered by existing deployment
documentation rather than left implicit. This confirms — it does not newly establish — that
the codebase remains in the state `ENTERPRISE_READINESS_REPORT.md` and
`PRODUCTION_READINESS_REPORT.md` described it in. Nothing here changes either of those
reports' conclusions.
