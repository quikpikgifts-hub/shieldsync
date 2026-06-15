# Veridian — API & System Verification
# Phase 2: Verified against actual source code
# All findings are from direct code inspection, not assumptions.

---

## api/contact.js — Lead Capture

**Status: IMPLEMENTED**

Endpoint: `POST /api/contact`

Input: `{ name, email, biz, phone, challenge, calcData }`

Validation:
- name + email required (400 if missing)
- calcData is optional (leads without calculator data still captured)

What it does (in order):
1. Generates `leadId` = `vrd_{timestamp}_{random5}`
2. Calculates priority:
   - HOT: urgent keywords in challenge OR annual ≥ $200K
   - HIGH: annual ≥ $75K
   - MEDIUM: annual ≥ $25K
   - LOW: below $25K or no calculator data
3. Stores in KV:
   - `SET veridian:lead:{leadId}` — full lead record
   - `LPUSH veridian:leads` — list for dashboard (max 200 returned)
4. Schedules follow-up sequences:
   - `ZADD veridian:fu:24h` — 24 hours out
   - `ZADD veridian:fu:3d` — 3 days out
   - `ZADD veridian:fu:7d` — 7 days out
   - `ZADD veridian:fu:14d` — 14 days out
5. GHL: creates contact + note + opportunity (if pipeline configured)
6. Email via Resend: team alert + prospect confirmation
7. Webhook: if `CONTACT_WEBHOOK_URL` set
8. Returns: `{ success: true, leadId, priority }`

If KV not configured: storage silently skipped, email still attempts.
If Resend not configured: email silently skipped, KV still works.

---

## api/assessment.js — Assessment Report

**Status: IMPLEMENTED**

Endpoint: `POST /api/assessment`

Input: `{ email, name, overallPct, level, areaScores, recommendations }`

Validation: email required

What it does:
1. Generates `assessmentId` = `asmnt_{timestamp}_{random5}`
2. Priority: <40=HOT, <60=HIGH, <80=MEDIUM, ≥80=LOW
3. Stores assessment + lead record in KV
4. Schedules 24h + 3d follow-up (assessment leads get 2-touch, not 4)
5. Sends team alert (score, breakdown, recommendations) via Resend
6. Sends client report (score, breakdown, booking link) via Resend
7. Returns: `{ success: true, assessmentId, priority }`

---

## api/book.js — Consultation Booking

**Status: IMPLEMENTED**

Endpoint: `POST /api/book`

Input: `{ leadId, slot, name, email, biz }`
- `slot` = `{ date, time, id }` — generated client-side from getSlots()

Validation: slot + email required

What it does:
1. Stores booking in `veridian:bookings` list
2. Marks lead as booked: `SET veridian:booked:{leadId} 1`
3. Sends team notification: client name, slot, action items
4. Sends client confirmation: date, time, "we'll send calendar invite"
5. Returns: `{ success: true, bookingId }`

Note: No actual calendar integration. Team must manually send calendar invite.
This is a known gap — manual step required after each booking.

---

## api/leads.js — Dashboard

**Status: IMPLEMENTED**

PIN authentication via `Authorization: Bearer {DASH_PIN}` or `?pin=`

GET: Returns up to 200 leads, enriched with booking + status flags
PATCH: Update lead status:
  - action="proposal" → marks proposalSent + proposalDate
  - action="won" + value=monthly_revenue → marks clientWon, records revenue
  - action="revenue" + value=n → updates monthlyRevenue only
  - action="unmark_won" → clears clientWon
  - action="unmark_proposal" → clears proposalSent
POST: Self-ingestion endpoint (if CONTACT_WEBHOOK_URL = /api/leads)

Dashboard URL: `/dashboard` — PIN-gated

---

## api/follow-up.js — Follow-Up Engine

**Status: IMPLEMENTED**

Cron: `GET /api/follow-up` with `Authorization: Bearer {CRON_SECRET}`
Schedule (vercel.json): `0 9 * * *` = 9 AM UTC daily

4 sequences with verified templates:

| Sequence | Timing | Subject Pattern |
|---|---|---|
| 24h | Day after contact | "About the $X/yr you calculated" |
| 3d | 3 days after | "Quick question about {business}" |
| 7d | 1 week after | "What businesses like {business} see" |
| 14d | 2 weeks after | "Closing your file, {name}" |

Each email uses actual lead data (name, business, calculator numbers).
Unsubscribe check: skips if `veridian:unsub:{email}` exists in KV.
Logs each send to `veridian:fu-log:{leadId}`.

Manual trigger: `POST /api/follow-up` with `{ action:"send", leadId, sequence }`

Assessment leads: get 24h + 3d only (contact leads get all 4).

---

## api/ai.js — AI Recovery Plan

**Status: IMPLEMENTED — requires ANTHROPIC_API_KEY**

Endpoint: `POST /api/ai`
Input: `{ messages, system, max_tokens }`
Model: `claude-sonnet-4-6`

Used by:
- Contact form "Generate My Recovery Plan" button (Contact component, step="plan")
- Prompt is built in Website.jsx with actual calculator data injected

If ANTHROPIC_API_KEY not set: returns 500 with `{ error: "API key not configured" }`.
Frontend catches this and shows: "AI plan generation requires ANTHROPIC_API_KEY."

---

## Known Gaps

| Gap | Severity | Fix |
|---|---|---|
| No actual calendar integration | MEDIUM | Team manually sends Google/Outlook invite after each booking |
| Booking slots generated client-side (no conflict check) | LOW | Two prospects could book the same slot — manual coordination needed |
| DASH_PIN default "0000" | CRITICAL | Set DASH_PIN in Vercel env vars before first lead |
| Cron requires Vercel Pro | MEDIUM | Without Pro, follow-up emails never send |
| No unsubscribe link in follow-up emails | MEDIUM | Manual opt-out only (team sets veridian:unsub:{email} in KV) |
| assessment.js REC_LABELS had stale "AI Front Desk" | FIXED | Updated to "Always-Available Coverage" in this deploy |

---

## Verification Summary

| System | Code Present | Works Without Config | Works With Config |
|---|---|---|---|
| Lead storage (KV) | YES | NO (silent skip) | YES |
| Dashboard | YES | NO (shows "not configured") | YES |
| Follow-up engine | YES | NO (cron auth fails) | YES (Pro) |
| Team email alerts | YES | NO (silent skip) | YES |
| Prospect email confirm | YES | NO (silent skip) | YES |
| GHL contact creation | YES | NO (silent skip) | YES |
| GHL opportunity | YES | NO | YES (+ pipeline IDs) |
| AI recovery plan | YES | NO (500 error, caught) | YES |
| Booking storage | YES | NO (silent skip) | YES |
| Assessment storage + email | YES | NO (silent skip) | YES |
