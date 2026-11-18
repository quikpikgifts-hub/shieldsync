# Quik Pik Productions — Agency Launch Plan

**Status:** Phase 1 audit started  
**Working branch:** `quik-pik-agency-launch`  
**Operating priority:** Lowest sustainable cost / high client volume  
**Software budget ceiling:** USD $50/month  
**Publishing rule:** No post is published without the client's explicit approval  
**Quality rule:** Nothing ships below 90/100

## 1. Approved lean platform stack

| Function | Selected tool | Initial spend | Operating rule |
|---|---|---:|---|
| AI video generation | Kling Standard | Budget $8.80/month; verify checkout price and credits before subscribing | Use selectively for B-roll and scenes, not every shot |
| Editing and captions | CapCut Free | $0 | Upgrade only when a specific paid feature saves measurable time |
| Brand graphics | Canva Free | $0 | Reuse approved brand templates |
| Scheduling and analytics | Metricool Starter | $20/month annual-billing equivalent; verify billing term and brand limit | Quik Pik plus up to four client brands at the five-brand tier |
| Client workflow | Existing ShieldSync codebase | $0 new spend | Do not claim features are production-ready until verified |
| Premium video backup | Runway Free | $0 | Reserve for special shots; do not buy a paid plan yet |

**Planned recurring software total:** $28.80/month on the stated annual-billing assumptions. Keep at least $21.20 below the $50 ceiling for price differences or necessary operating costs. Do not activate subscriptions until the account checkout price, renewal terms, credit allowance and cancellation terms are confirmed.

## 2. Service packages — controlled scope

### Starter — $99/month
- Four vertical short-form videos per month
- One connected social platform
- Client-supplied footage, logo and business information
- Captions and basic branded treatment
- Scheduling after explicit approval
- One consolidated revision round per monthly batch

### Growth — $179/month
- Eight vertical short-form videos per month
- Up to two connected platforms
- Captions, branded treatment and scheduling
- Monthly performance summary
- One consolidated revision round per monthly batch

Not included in either package: filming, paid ad spend, community management, inbox response, unlimited revisions, guaranteed views/leads, extensive bespoke animation, or unlimited AI generations. Additional services require a separate quote.

## 3. Unit-economics assumptions

These are planning assumptions to validate during the pilot, not measured historical costs.

- Internal labor value: $20/hour.
- Editing allowance: 25 minutes per finished video.
- Client administration: 20 minutes per client/month.
- Payment processing reserve: 3% of revenue.
- Shared software allocation at five clients: $44.80 / 5 = $8.96 per client/month. This assumes Metricool's ten-brand Starter tier at $36/month annual-billing equivalent plus Kling at $8.80/month.
- One five-second AI B-roll scene per client/month, with one retry. The remaining visuals should be client footage, reusable templates or appropriately licensed stock.
- No double-counting of AI credits: the Kling subscription is included in shared software cost.

| Package | Labor hours | Labor cost | Software allocation | Payment reserve | Estimated direct cost | Contribution before other overhead/tax |
|---|---:|---:|---:|---:|---:|---:|
| Starter $99 | 2.00 | $40.00 | $8.96 | $2.97 | $51.93 | $47.07 |
| Growth $179 | 3.67 | $73.33 | $8.96 | $5.37 | $87.66 | $91.34 |

The model excludes owner sales time, bookkeeping, taxes, refunds, storage, stock licenses, extra AI credits, and unexpected revisions. Track actual minutes and credit use per client. If average labor exceeds the allowance, adjust scope or price before accepting more clients.

## 4. Initial operating workflow

1. Lead applies through the Quik Pik intake process.
2. Verify business identity, service area, authorized contact details and social account ownership.
3. Collect brand assets, approved claims, footage, preferred platforms and client permissions.
4. Create the content brief and monthly calendar.
5. Draft scripts and captions; produce videos using the approved templates.
6. Run legal/platform checks and the 90/100 quality scorecard.
7. Send the actual finished asset to the client for explicit approval.
8. Schedule only after approval and confirmed account authorization.
9. Record publication URL and date.
10. Report performance monthly and record production time, credit use and revisions.

Every asset must retain client, platform, status, approval timestamp, approver and revision history. A draft, an approved post and a published post are distinct states.

## 5. Technical audit findings — current repository

Repository: `quikpikgifts-hub/shieldsync`

Inspected files include `README.md`, `package.json`, `src/main.jsx`, `src/shell/Shell.jsx`, `src/lib/auth.js`, `src/social/store.js`, `src/social/shared.jsx`, `api/auth/session.js`, `api/social/generate.js`, `api/social/publish.js`, and `api/_lib/publishers/tiktok.js`.

Findings:
- The README is stale and describes a Firebase security-management application; the current source is a Vite/React application with social-management modules.
- The shell uses Supabase-backed authentication through API endpoints, but social workspaces, brands, content items and media references are currently localStorage-backed.
- The content/media data layer explicitly says persistent Postgres/RLS storage and real media upload are not yet implemented.
- TikTok publishing is documented as a single-tenant pilot, not a multi-client publishing system. Its source says the live account path has not been exercised and public posting depends on TikTok app audit/configuration.
- The social publish endpoint accepts a platform and content item without a client-side approval enforcement check in that endpoint. UI approval states alone are not an adequate security boundary.
- The dashboard's fallback path can copy content for manual posting; it must not represent a clipboard copy as a successful social publication.
- The connected Metricool account currently lists only Quik Pik Instagram, TikTok and Facebook. Huggins is not connected as a separate client brand.

**Release blockers:** Do not onboard multiple paying clients into this code path as though it were a secure SaaS; do not store client credentials or sensitive assets in localStorage; do not enable unattended publishing; do not treat a scheduled or copied post as published. First implement and test server-side tenant isolation, persistent data storage, media storage, approval enforcement, per-client social authorization and audit logging.

## 6. Implementation sequence

### Phase A — operational foundation
- Verify actual Kling and Metricool checkout plans and billing terms.
- Confirm Metricool's five-brand or ten-brand capacity before adding clients.
- Create reusable Starter and Growth templates.
- Establish a client intake checklist, asset permissions checklist, approval record and 90/100 scorecard.
- Run the Huggins pilot manually; use only footage George has supplied and approved. Do not publish until Huggins' own account is connected or the client elects to publish manually.

### Phase B — ShieldSync safety and multi-client foundation
- Replace localStorage-backed client records with server-side persistent storage and row-level tenant access controls.
- Introduce organizations, client brands, members and role-based permissions.
- Add media upload/storage with per-client access restrictions.
- Add server-side approval records and require approved status plus authorized publisher connection before any publish action.
- Move social tokens to per-client encrypted storage; remove single-tenant token assumptions.
- Add append-only audit events for approvals, edits, schedules and publishing.
- Test cross-tenant access denial and failed/expired authorization paths.

### Phase C — controlled publishing and scale
- Integrate Metricool or the authorized native platform APIs per client, without reusing Quik Pik's own account for client posts.
- Start with manual review and scheduling; only automate publishing after end-to-end authorization and approval tests pass.
- Measure labor minutes, AI credits, revision count, publish failures, retention and gross contribution per client.
- Scale from 5 to 15 clients only after the five-client cohort meets the margin and quality gates.

## 7. Pilot acceptance criteria

The first pilot is successful only when:
- Four finished vertical videos are delivered.
- Every deliverable scores at least 90/100.
- Client approval is recorded for each asset.
- Publishing authorization is verified, or the client posts manually.
- No unapproved post is published.
- Actual production time and AI credit use are logged.
- No claim of reach, leads or sales is made without measured evidence.

## 8. Weekly operating dashboard

Track per client:
- Videos planned / produced / approved / published
- Quality score
- Labor minutes
- AI credits consumed
- Revision rounds
- Scheduled vs. successfully published
- Views, reach, watch time, shares, saves and attributable leads where available
- Revenue, payment fees, allocated software cost and contribution

**Decision rule:** Keep the monthly software spend under $50 until measured demand and client contribution justify expansion. Do not buy additional AI subscriptions to compensate for an inefficient production workflow.
