# Veridian AI — Executive Program Charter: Strategy Response

*Executive-team consensus deliverable. Six tasks below (Platform Separation, Enterprise Architecture, Veridian Social Design, Implementation Roadmap, Simplification Pass, Launch Prep). Grounded in `ops/veridian-platform-audit.md` — every architectural claim here maps to a real file or finding from that audit, not generic SaaS boilerplate. This is a strategy document only; no code changes are made in this pass.*

---

## Executive Summary — the one decision this charter makes

The prior audit surfaced a real question: is this repo Veridian Risk Group (the live missed-call/revenue-recovery business) or Veridian Social (the unstarted AI-social-media product)? **This charter answers it: both, sequenced, on one shared foundation.**

- The existing business (currently branded "Veridian Risk Group," built in `src/Website.jsx` + `api/*.js`) **keeps running, unmodified in customer-facing behavior**, and becomes the first product on the platform. **Recommendation: rename it "Veridian Connect"** — it is fundamentally a communications/engagement product (missed-call recovery, AI receptionist, follow-up automation), which fits the `Connect / Social / Fleet / Risk / Workforce` product family named in this charter better than "Risk Group" does. This is a naming recommendation for the founder to confirm, not something executed in this pass.
- **Veridian Social is built new**, as the second product, sharing the platform's auth, billing, AI gateway, and notifications — not forked from Connect's code, and not blocking Connect's operation.
- The legacy `src/App.jsx` "OperaCore" CRM demo is **retired**, not migrated. It has no real users, it's disconnected from the live business logic, and it ships plaintext demo credentials into the production bundle (audit finding). Its two genuinely reusable ideas — a tenant/org data shape and a risk/compliance module concept — are absorbed conceptually into the new schema below, not carried forward as code.

---

## Task 1 — Platform Separation Strategy

Principle: **anything a second product would need is platform. Anything specific to how Connect or Social operates is product.** Mapped against what exists today:

| Platform service (shared) | Source today | Disposition |
|---|---|---|
| **Identity & Auth** | `DASH_PIN` — single static PIN, no user identity (audit: CRITICAL) | Net-new. Real auth (Supabase Auth) becomes a platform service both products consume. Nothing to reuse — this is the single highest-leverage platform build. |
| **Organizations / Workspaces / Membership** | `src/db.js`'s `platform.tenants` / `platform.users` shape (from the retired OperaCore demo) | Reuse the *shape*, not the code — it's the right mental model (tenant → users → role), just needs a real relational backing instead of localStorage. |
| **AI Gateway** | `api/ai.js` (generic Anthropic proxy, origin-gated, rate-limited) + `api/chat.js` (duplicate, purpose-built) | Reuse As-Is as the pattern, consolidate the two into one gateway (see Task 2). This is the seed of the "AI workforce" infrastructure both products need. |
| **Notifications (email/SMS)** | `sendEmail()` (Resend) duplicated in 4 files; `sendSMS()` (Twilio) duplicated in 2 files | Reuse the logic, extract to one shared module. Both products will need transactional email; only Connect needs SMS today, but the module should be product-agnostic. |
| **Billing / Subscriptions** | None exists | Net-new. Built once, shared by both products (Connect has none today — proposal-based; Social requires it from day one). |
| **Storage / Media** | None exists (Connect has no media pipeline) | Net-new, needed for Social's brand assets and generated images; build as a platform service so future products don't reinvent it. |
| **Audit Logging** | `platform.audit.log()` in `src/db.js` (unused, demo-only) | Reuse the shape (`userId, tenantId, action, detail, ts`), rebuild on real storage. |
| **Analytics / Events** | `api/metrics.js` (Connect-specific, reads Supabase directly) | Refactor into a generic event-ingestion + per-product dashboard pattern, so Social's analytics doesn't require a bespoke endpoint like this one is. |
| **API conventions (CORS, rate limiting, edge runtime)** | Present but inconsistent across `api/*.js` (audit finding) | Standardize once as a platform convention (shared middleware), applied to both products' routes. |
| **Admin/Ops console** | `/dashboard` (Connect leads only, PIN-gated) | Evolve into a platform-level admin console with product-scoped views, behind real auth. |

| Product-specific (NOT shared) | Belongs to |
|---|---|
| Revenue calculator, assessment engine, missed-call SMS/voice automation, follow-up drip sequences, GoHighLevel sync | **Veridian Connect** |
| Brands, brand voice/memory, content calendar, AI content generation, approval workflow, publishing pipeline, social analytics | **Veridian Social** |

**Consensus (CTO / Principal Architect / Startup Advisor):** Do not attempt a big-bang extraction. Connect's revenue-generating code (`api/contact.js`, `assessment.js`, `book.js`, `follow-up.js`) is not touched for its own sake — it gets migrated onto shared Auth/Billing/AI-Gateway incrementally, in the sprints below, specifically because the Strategic Principle forbids destabilizing an operating business for architectural tidiness.

---

## Task 2 — Enterprise Platform Architecture

### System architecture

```
                    ┌─────────────────────────────────────┐
                    │         Veridian Platform Core        │
                    │  Auth · Orgs · Billing · AI Gateway   │
                    │  Notifications · Storage · Audit ·     │
                    │  Analytics · Feature Flags             │
                    └───────────────┬───────────────────────┘
                                    │  shared APIs / SDK
                ┌───────────────────┼────────────────────┐
                │                                         │
      ┌─────────▼──────────┐                  ┌───────────▼─────────┐
      │   Veridian Connect   │                  │    Veridian Social    │
      │ (existing business)  │                  │      (new build)      │
      │  leads · assessment  │                  │ brands · calendar ·   │
      │  · booking · SMS/    │                  │ AI content · publish  │
      │  voice · follow-up   │                  │ pipeline · analytics  │
      └───────────────────────┘                  └───────────────────────┘
```

Both products are Vercel Edge Functions + a React SPA shell, same as today — that part of the stack is validated by a working product and is **not** being replaced. What changes is that product code calls into platform services instead of reimplementing them per route.

### Module boundaries

- Platform code lives under `platform/` (or `api/_platform/` for the edge functions) — auth, billing, AI gateway, notifications, storage, audit, analytics.
- Each product lives under its own namespace — `products/connect/`, `products/social/` — and may only call platform services through a defined interface, never reach into another product's tables directly.
- Shared UI primitives (buttons, cards, modals, design tokens) extracted into `src/platform-ui/`, since both `Website.jsx` and any future Social UI currently reinvent these inline.

### Database architecture (the single biggest change from today)

**Decision: Supabase Postgres becomes the sole system of record.** Today's split-brain (audit finding: KV and Supabase both hold leads/bookings with no reconciliation) ends. Vercel KV is demoted to cache, rate-limiting, and short-lived queue duty only — never authoritative data.

Core schema (platform):
```
organizations(id, name, slug, plan, status, created_at)
users(id, email, name, created_at)
memberships(org_id, user_id, role, created_at)          -- owner/admin/member/client_viewer
product_entitlements(org_id, product_key, status)        -- which products an org can use
subscriptions(org_id, stripe_customer_id, stripe_sub_id, plan, status)
invoices(org_id, stripe_invoice_id, amount, status, period)
audit_log(id, org_id, user_id, action, detail, created_at)
notifications_log(id, org_id, channel, to, template, status, created_at)
ai_usage(id, org_id, product_key, agent, tokens_in, tokens_out, cost_cents, created_at)
feature_flags(org_id, flag_key, enabled)
```

Product schema (namespaced, owned by each product, foreign-keyed to `organizations`):
```
connect_leads / connect_bookings / connect_assessments / connect_followups   -- migrated from today's KV+Supabase split
social_brands / social_brand_voice / social_content_items / social_calendar / social_publish_jobs / social_analytics_snapshots
```

**Migration note:** the audit found `contact.js`/`assessment.js`/`metrics.js` already write to a Supabase `leads` table with **no migration file in the repo** — that schema is undocumented today. Writing the missing migration for `connect_leads` (formalizing what's already live) is a Sprint 0 item, not new work.

### Authentication & authorization

Replace `DASH_PIN` with Supabase Auth (email/password + magic link). Session → JWT → `org_id` + `role` claims. Row-Level Security policies scoped by `org_id` on every product table, so a Social bug can never leak Connect data or vice versa, and a member of one org can never see another's rows even through a raw query. Admin console requires `role IN (owner, admin)`.

### API architecture

- One AI Gateway: `POST /api/ai/generate` — `{org_id, product, agent, messages}` → checks entitlement → applies per-agent system prompt (registry, not hardcoded per caller like today's `ai.js`/`chat.js` split) → calls Anthropic → logs to `ai_usage` (this is also the metering hook billing needs) → returns.
- Product APIs keep the edge-function-per-route shape that already works (`api/connect/contact`, `api/social/content`, etc.), but import shared `_platform/kv.js`, `_platform/email.js`, `_platform/sms.js`, `_platform/auth.js` instead of each hand-rolling `kv()`/`sendEmail()`/`cleanEnv()` (audit finding: these already exist 6+ times, already drifting).

### Background workers & events

Today's single daily cron (`0 9 * * *` → `/api/follow-up`) stays for Connect. Social adds: a `social_publish_jobs` queue (scheduled posts) processed by a similar cron pattern initially — **not** a new job-queue system (e.g. no BullMQ/Temporal) until volume actually demands it. An `ai_usage` write on every AI Gateway call functions as the event stream billing/analytics consume — no separate event bus needed at this scale.

### Storage & media pipeline

Supabase Storage buckets, namespaced per org (`social/{org_id}/brand-assets/...`, `social/{org_id}/generated/...`), signed URLs, no public buckets. This is entirely net-new — Connect has never needed file storage.

### AI orchestration (the "AI workforce" foundation)

Each AI employee (Content Strategist, Copywriter, etc. — full roster in Task 3) is a row in an `agents` registry: `{key, product, system_prompt, tools, model}`, called through the one AI Gateway. This directly satisfies the charter's requirement that agents be "reusable, independently extensible, replaceable without affecting the entire system" — replacing an agent means editing a registry row, not a code path.

### Deployment, monitoring, security, scalability

- Deployment: stays on Vercel, same as today — no reason to move a working pipeline. Add a real **staging environment** (currently absent; audit found no distinct staging/production separation).
- Monitoring: add error tracking (e.g. Sentry) — currently nothing catches production errors beyond `console.error`. Add Vercel Web Analytics for product usage.
- Security: fixes the audit's ranked risk list (PIN → real auth; webhook auth fail-open → fail-closed; Twilio signature verification; CSP header) as Sprint 0, before any platform build — building new products on top of known-critical auth gaps would be malpractice.
- Scalability: Edge + Postgres + Supabase Storage scales well past beta volume without redesign; revisit only if/when a specific bottleneck is measured, not preemptively.

---

## Task 3 — Veridian Social Product Design

**Mission:** Give a business owner an AI marketing team they can direct in minutes a day, with final say on everything that goes out under their name.

**Customer personas (Phase 1, per charter's target list):** independent restaurant/gym/law-firm/medical-office/contractor/retail owner — one person wearing the marketing hat alongside everything else, no in-house designer or copywriter, currently posting inconsistently or not at all.

**Value proposition:** Not "more followers" or "guaranteed revenue" — **consistency and time recovered.** The product's job is to make daily professional social presence take under 10 minutes of the owner's day, with every post reviewed and approved by them before it goes anywhere.

**Core features (MVP → later, explicitly sequenced — see Roadmap for what's cut from v1):**

| Feature | MVP (v1) | Later |
|---|---|---|
| Workspace + single brand | ✅ | Multi-brand: Task 4 Sprint 3 |
| Brand profile (voice, audience, assets) | ✅ (form-based) | AI-refined brand memory that improves from approvals/edits over time |
| AI content generation — captions + post copy | ✅ | Video scripts, image prompts, hashtag sets |
| Content calendar (list + calendar view) | ✅ | Drag-and-drop rescheduling, conflict view |
| Approval workflow | ✅ — every AI draft requires explicit human approval before scheduling | Multi-approver workflows (agency tier) |
| Scheduling | ✅ (time-based) | Optimal-time suggestions from analytics |
| Publishing | Manual "mark published" + copy-to-clipboard (v1) | Real platform publishing APIs (Meta/Instagram first, then others) — Sprint 2 |
| Analytics | Manual entry / basic counts (v1) | Platform-API-sourced engagement analytics |
| Notifications | Email digest of pending approvals | In-app + SMS reminders |

**Why publishing is manual in v1:** Meta/TikTok/LinkedIn API access requires app review and per-platform OAuth work that's a real multi-week dependency each. Shipping AI generation + approval + a clean manual hand-off first lets the founder validate the core loop (does AI-drafted content save real time and get approved as-is often enough to be worth paying for) before investing in the highest-effort integration. This is a Task 5 simplification call, not an oversight.

**AI workforce (registry-based, per Task 2's architecture):**

| Agent | MVP scope |
|---|---|
| Brand Strategist | Turns the brand-profile form into a persistent "brand voice" system prompt used by every other agent. |
| Content Strategist + Copywriter (combined in v1) | Generates the calendar's draft posts + captions from the brand voice and a content-pillar input. |
| Publisher (manual in v1) | Formats the approved draft for copy/paste per platform; becomes a real publishing agent in Sprint 2. |
| Analytics Advisor | Later — summarizes performance trends once real analytics data exists. |
| *(Trend Analyst, Video Producer, Graphic Assistant, Community Manager, Growth Advisor)* | Explicitly deferred past MVP — see Task 5. Building 10 agents before validating 3 is the exact kind of scope this charter says to cut. |

**Approval workflow:** every AI-generated item enters as `draft` → owner reviews in-app → `approved` (queued to schedule) or `edited` (owner's edit becomes the new brand-memory training signal) or `rejected`. Nothing reaches "scheduled" without an explicit approve action. This is the direct implementation of "the customer always retaining final approval" from the master mandate.

**Pricing & subscription model (anchored to the charter's tier names, priced for the actual persona — a solo owner, not an agency):**

| Tier | Target | Monthly | Included |
|---|---|---|---|
| Starter | Solo owner, 1 brand | $79 | 1 brand, AI captions/copy, calendar, manual publish, email support |
| Professional | Growing business, wants real publishing | $199 | 1 brand, platform auto-publish (once built), basic analytics, priority support |
| Agency | Manages multiple client brands | $399+ (per-brand add-on) | Multi-brand, multi-approver workflow, white-label option |
| Enterprise | Custom | Custom | SSO, custom SLAs, dedicated support |

*Pricing is a hypothesis, not a commitment — validate before quoting publicly (see Task 6).* Note the deliberate consistency with the founder's existing comfort proposing $199-anchored pricing (visible in Connect's own `ops/service-packages.md` conventions and commit history) — reuses validated pricing psychology rather than inventing new numbers from nothing.

**Beta strategy, launch criteria, success metrics:** see Task 6 (kept together with the rest of launch prep to avoid duplicating the same content twice).

---

## Task 4 — Implementation Roadmap

Grouped into 4 phases, ~14–16 weeks total to a real beta, one engineer at current velocity (matches the audit's own effort estimate — Connect hardening was ~1–2 weeks; Social MVP is the new, larger piece).

| Sprint | Objective | Key deliverables | Depends on | Acceptance criteria / DoD | Risk | Test/deploy |
|---|---|---|---|---|---|---|
| **0a — Security patch** (3–4 days) | Close the audit's CRITICAL/HIGH findings before building anything new | Real `DASH_PIN` replacement path started; Vapi/Twilio webhooks fail-closed + signature verification; `App.jsx` demo removed from production bundle; CSP header | none | All 3 audit HIGH-risk items resolved; no plaintext secrets in built bundle (`grep` the dist output) | Low effort, high consequence if skipped | Manual verification against `ops/veridian-platform-audit.md` checklist |
| **0b — Storage consolidation** (1 wk) | End the KV/Supabase split-brain | `connect_leads`/`connect_bookings` migrations written; `api/leads.js`+`metrics.js` read one source; KV demoted to cache-only | 0a | Dashboard and metrics endpoint agree on every lead, always | Data migration risk — dry-run against prod data copy first | Add first Vitest coverage on migrated read paths |
| **1 — Platform core: Auth + Orgs** (2 wks) | Real identity, replacing PIN | Supabase Auth wired; `organizations`/`memberships`/RLS live; admin console behind real login | 0b | A team member can log in with their own account and see only their org's data | Auth migrations are hard to reverse — stage on preview env first | Auth flow e2e test (login, RLS boundary test) |
| **2 — Platform core: AI Gateway + Billing skeleton** (2 wks) | Shared services both products need | `/api/ai/generate` consolidating `ai.js`+`chat.js`; `agents` registry; Stripe org-subscription skeleton (no live pricing yet) | 1 | Connect's existing AI recovery-plan feature runs through the new gateway with no behavior change | Regressing a revenue-generating feature — feature-flag the cutover | Contract test: old vs new gateway output parity on sample prompts |
| **3 — Veridian Social MVP: brand + calendar + AI drafts** | First Social feature slice | Workspace/brand creation, Brand Strategist agent, calendar UI, Content Strategist+Copywriter agent, draft/approve/reject states | 2 | Founder can create their own brand, generate a week of drafts, approve/edit/reject each | New product — biggest unknown; keep scope to what's in Task 3's MVP row only | Component tests on approval state machine |
| **4 — Manual publish + analytics v0** (1.5 wks) | Close the loop to something usable end-to-end | Copy-to-clipboard publish flow, manual "mark published," basic post/engagement counters | 3 | Founder runs a full week on their own accounts using only the product (MVP success criterion) | Low | Dogfood test = acceptance test |
| **5 — Billing goes live + pricing validation** (1 wk) | Turn Stripe skeleton into real subscriptions | Checkout, plan enforcement via `product_entitlements`, invoices | 2, and pricing interviews from Task 6 | A test card can subscribe, get gated access, and cancel cleanly | Payment bugs are high-consequence — test in Stripe test mode extensively before going live | Stripe webhook integration tests |
| **6 — Real publishing integration (1 platform)** | Remove the manual-publish limitation | Meta/Instagram OAuth + publish API, `social_publish_jobs` queue | 4 | A scheduled, approved post actually publishes without manual copy/paste | Platform API review/approval timelines are outside our control — start the app-review process in parallel with Sprint 3, not after | End-to-end publish test against a real test account |
| **7+ — Beta hardening, second platform, multi-brand** | Ongoing, informed by real beta feedback | Per Task 6 (launch) findings | 6 | Defined once beta feedback exists, not speculatively now | — | — |

---

## Task 5 — Simplification pass (challenge every major call above)

| Decision | Can it be simpler / reused / shipped sooner? | Verdict |
|---|---|---|
| Build all 10 AI workforce agents for launch | No customer needs a Video Producer agent before they trust the Copywriter agent | **Cut to 3 for MVP** (already reflected in Task 3) |
| Real multi-platform publishing before launch | Adds weeks of OAuth/app-review dependency per platform, for a capability manual copy/paste covers at v1 | **Defer to Sprint 6, ship manual-publish MVP first** |
| New job-queue infrastructure for scheduling | Connect's existing daily-cron pattern already works in production | **Reuse the cron pattern, don't add new infra** |
| Rewrite Connect's funnel onto the new platform in one shot | Connect is revenue-generating today; a rewrite risks the "don't destroy an operating business" mandate for no customer-visible benefit | **Incremental cutover only (Sprint 2), never a rewrite** |
| Multi-brand support at launch | Target persona (Task 3) is a solo single-brand owner | **Defer to post-beta (Sprint 7+)**, unless a specific beta customer needs it sooner |
| White-label / marketplace / enterprise SSO | None of this is needed to prove the core loop with the first 10 customers | **Explicitly out of scope until Social has paying customers** |
| Migrate `App.jsx`'s CRM concepts (risk/compliance modules) forward | Zero current users, zero validated demand, and it's a security liability as-is | **Retire, don't migrate. Revisit only if "Veridian Risk" becomes a real roadmap item** |

Would a paying customer use each *kept* item today? Auth — yes, they can't use the product without it. Billing — yes, that's the whole point. AI drafts + approval — yes, that's the value prop. Manual publish — acceptable friction for v1, not a blocker. Everything in the "cut" column above failed this test and was removed.

---

## Task 6 — Launch Preparation

**Beta strategy:** Founder tests on personal accounts first (hard MVP success criterion — must pass before any external beta invite). Then 5–10 friendly businesses, weighted toward Connect's existing customer relationships (warm trust already exists) plus 2–3 of the charter's target personas the founder doesn't already know, to avoid selection bias in feedback.

**Customer onboarding:** Create account → create workspace → add brand (guided form, not a blank page) → AI generates first week of drafts immediately (time-to-value in the first session, not after setup) → review/approve → founder or in-app guide walks first-time scheduling. Mirrors the charter's prescribed onboarding sequence.

**Pricing validation:** Do not publish the Task 3 pricing table publicly at beta launch. Run it as paid-beta pricing in direct conversation (same "propose after reviewing their situation" instinct already proven out in Connect's `ops/service-packages.md`), and lock public pricing only after 5+ beta customers have actually paid at a given number without pushback.

**Support model:** Founder-led, high-touch for beta (matches Connect's current model — no reason to build a support system before there are support tickets to justify it). Revisit only once beta headcount makes that unsustainable.

**Documentation, monitoring, analytics, ops playbooks:** Rewrite `README.md`/`CLAUDE.md` to describe reality (both products, honestly) — carried over as an unresolved audit action item, now with a home (Sprint 0a). Add Sentry + Vercel Analytics (Task 2). Ops playbooks needed at launch: content-approval SLA, publish-failure runbook, brand-onboarding runbook — modeled directly on the existing `ops/beta-launch-checklist.md` / `ops/first-customer-audit.md` format, which the audit already flagged as the strongest asset in the repo.

**Launch checklist (Social, mirrors Connect's proven checklist structure):**
- [ ] Auth + RLS verified: one org cannot see another's data (test with two real accounts)
- [ ] Stripe test-mode → live-mode checkout verified end-to-end
- [ ] AI Gateway cost/usage logging confirmed accurate against Anthropic's own billing
- [ ] Founder has run one full real week on their own account
- [ ] Approval workflow: confirm nothing reaches "scheduled" without explicit human approval
- [ ] Error tracking (Sentry) confirmed capturing real errors, not silently swallowing them
- [ ] Support channel (email/Slack) live and monitored

**30 / 90 / 12-month plan:**
- **30 days post-Sprint 4:** Founder + first 3 beta customers running weekly, manual-publish loop. Pricing conversations start.
- **90 days:** Real publishing integration live (Sprint 6), billing live, 10 paying beta customers, public pricing set from validated data.
- **12 months:** Social is a real second revenue line alongside Connect; platform core (auth/billing/AI gateway) is proven across two products, making a third (Fleet, Risk, or Workforce per the charter's roadmap) a matter of product work, not platform work — which is the entire point of building the platform layer first.

---

## What this charter deliberately does not do

Per the audit's own scoping lesson: this document does not write the auth migration, the Stripe integration, or the Social UI. It commits to specific, checkable decisions (Supabase as sole system of record, one AI Gateway, 3 MVP agents not 10, manual publish before real publish, no rewrite of Connect) so that Sprint 0a can start from an unambiguous spec rather than another round of scoping. The next concrete step is Sprint 0a itself — the security patch — which is small, reversible, and doesn't require the product-direction question to be re-litigated.
