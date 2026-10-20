# ShieldSync / Veridian AI Platform

**Current product identity:** Veridian — Turn Missed Calls Into Revenue  
**Repository:** `quikpikgifts-hub/shieldsync`  
**Production URL:** https://shieldsync-jbsx.vercel.app/  
**Default branch:** `main`

> This repository has evolved beyond the original standalone security-management demo. The old Firebase/Firestore instructions below are not an authoritative guide to the current implementation. Use `ACTIVATION.md` for current environment-variable and integration requirements, and the `ops/` directory for product/architecture planning.

## Current architecture (source-code view)

- **Frontend:** React 19 + Vite 6 single-page application.
- **Hosting/API:** Vercel deployment with serverless/Edge API handlers under `api/`.
- **Authentication and organization identity:** Supabase Auth, with organization/membership provisioning in `api/auth/`.
- **Data/storage:** Supabase tables for selected records; Vercel KV/Upstash for selected lead, follow-up, rate-limit, and token-storage flows. Some Veridian Social brand/content state is still localStorage-based; do not assume all data is server-persisted.
- **AI:** Anthropic-backed API handlers.
- **Email:** Resend-backed transactional email handlers.
- **Optional integrations:** Twilio, GoHighLevel, social-platform publishing APIs, and Stripe billing skeleton. Each integration requires its documented configuration and platform permissions.

## What is implemented vs. what is activated

Source code for an integration does **not** prove its production credentials are present, its platform permissions are approved, or its end-to-end workflow is working. Check the production environment and run the tests before describing a feature as live.

- Stripe billing is documented as a skeleton until configured with valid credentials, webhook verification, and real products/prices.
- Social publishing implementations remain inactive until their required credentials and permissions are configured.
- Supabase migrations must be checked against the live project; the presence of SQL files in this repository does not prove they have been applied.
- Follow-up automation is scheduled in `vercel.json`; verify Vercel cron execution and email delivery in production.

## Local development

Requirements: a supported Node.js version and npm.

```bash
npm install
npm run dev
```

## Validation

```bash
npm test
npm run build
```

Run both commands before proposing a production deployment. Tests/build results must be recorded with the commit or pull request.

## Production-safety rules

1. Never commit secrets, API keys, access tokens, customer data, or production environment values.
2. Treat `.env.example` and `ACTIVATION.md` as configuration references, not proof that production is configured.
3. Do not deploy, merge, change pricing, activate billing, enable public publishing, or change production data without explicit owner approval.
4. Validate authentication, authorization, organization isolation, database RLS, and rate limiting before storing sensitive customer data or expanding access.
5. Use a feature branch and reviewable pull request for changes; do not make unreviewed changes directly on `main`.
6. Keep verified behavior separate from assumptions in all readiness reports.

## Audit documents

See `ops/SHIELDSYNC-PRODUCTION-READINESS.md` for the current source-review findings, open verification questions, and recommended order of work.
