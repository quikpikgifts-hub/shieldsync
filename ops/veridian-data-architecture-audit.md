# Sprint 0b — Task 1: Data Architecture Audit & Dependency Map

*Direct inspection of every `api/*.js` route as of Sprint 0a completion. This is the input to Task 2's migration design — no design decisions in this document, findings only.*

---

## Every location business data is stored

| Store | What lives there | Written by | Read by |
|---|---|---|---|
| **Vercel KV** (`veridian:lead:{id}`) | Full lead record (contact + calc data + priority) | `contact.js`, `assessment.js` | `leads.js` (dashboard), `follow-up.js` |
| **Vercel KV** (`veridian:leads` list) | Same record, pushed to a list for the dashboard feed | `contact.js`, `assessment.js` | `leads.js` |
| **Vercel KV** (`veridian:assessment:{id}` / `veridian:assessments`) | Assessment score + breakdown | `assessment.js` | *(nothing reads this back today — write-only)* |
| **Vercel KV** (`veridian:booked:{leadId}`) | Boolean: has this lead booked | `book.js` | `leads.js` (enrichment) |
| **Vercel KV** (`veridian:bookings` list) | Booking records | `book.js` | *(nothing reads this list back today — write-only)* |
| **Vercel KV** (`veridian:fu:{24h\|3d\|7d\|14d}` sorted sets) | Follow-up scheduling queue | `contact.js`, `assessment.js` (schedules), `book.js` (removes on booking) | `follow-up.js` (cron consumer) |
| **Vercel KV** (`veridian:fu-log:{leadId}`) | Follow-up send history | `follow-up.js` | *(nothing reads this back today — write-only)* |
| **Vercel KV** (`veridian:unsub:{email}`) | Unsubscribe flag | *(set manually by team, no route writes it)* | `follow-up.js` |
| **Vercel KV** (`veridian:status:{leadId}`) | Proposal-sent / won / revenue flags set from the dashboard | `leads.js` (PATCH) | `leads.js` (GET, enrichment) |
| **Vercel KV** (rate-limit counters, `rl:*`) | Ephemeral request counters | `contact.js`, `book.js`, `chat.js`, `ai.js` | same files |
| **Supabase Postgres `leads` table** | Contact-form leads only (schema undocumented — no migration file exists) | `contact.js` | `metrics.js` |
| **Supabase Postgres `bookings` table** (has a migration) | Booking records | `book.js` | `metrics.js`, `book.js` (duplicate-booking guard) |
| **Environment variables** | All secrets/config (`DASH_PIN`, `TWILIO_*`, `RESEND_API_KEY`, `GOHIGHLEVEL_*`, `ANTHROPIC_API_KEY`, `KV_*`, `SUPABASE_*`) | Vercel dashboard (operator-managed) | every route |
| **Third-party: GoHighLevel** | Contact + note + opportunity, created via REST API | `contact.js` | *(external system — Veridian has no read path back from it)* |
| **Third-party: Resend** | Transactional email — not queryable data, but the *only* record of what was sent if `notifications_log` doesn't exist (it doesn't) | `contact.js`, `assessment.js`, `book.js`, `follow-up.js` | *(none — no internal log of what emails were actually sent, only console logs)* |

## Duplicate storage / split-brain findings

1. **Assessment leads exist only in KV — never in Supabase.** `assessment.js` never calls `supabaseInsert`. `metrics.js` reads only from Supabase. **Concrete consequence: every assessment-sourced lead is invisible to `/api/metrics`, permanently, today.** This isn't a theoretical race condition — it's a guaranteed, 100%-reproducible gap for one whole lead source.
2. **Contact-form leads exist in both stores, written independently, with no shared ID reconciliation check.** `contact.js` writes to Supabase and KV in the same `Promise.allSettled` batch with no transaction — if the Supabase write fails and the KV write succeeds (or vice versa), the lead exists in exactly one store with no record that the other write failed, and no retry.
3. **Bookings exist in both stores**, and `book.js`'s own duplicate-booking guard reads from *Supabase* (`supabaseGet` against `bookings`) while `leads.js`'s "already booked" flag reads from *KV* (`veridian:booked:{leadId}`) — two different booking-truth checks, backed by two different stores, that could disagree if one write partially fails.
4. **No documented schema for the Supabase `leads` table.** `supabase/migrations/` contains only the `bookings` migration. The `leads` table referenced by `contact.js` and `metrics.js` exists solely as whatever was clicked together in the Supabase dashboard — unreproducible, unreviewable, and a single accidental schema change away from silently breaking `contact.js`'s insert.
5. **Assessment and booking write-only KV keys** (`veridian:assessments`, `veridian:bookings` list, `veridian:fu-log:*`) — data is being stored that nothing ever reads back. Not a correctness bug, but wasted writes and a sign the KV schema grew ad hoc rather than by design.
6. **No `notifications_log`.** Whether a given lead actually received their confirmation/follow-up email is only visible in Vercel's function logs (`console.log`/`console.error`), which are not queryable business data and expire. If a customer disputes "I never got a follow-up," there's no durable record to check.

## Race conditions & consistency risks (concrete, not hypothetical)

- **Contact form double-submit:** two rapid submissions from the same prospect generate two different `leadId`s (timestamp+random) in *both* stores — no idempotency key from the client, so a nervous double-click creates two leads, two follow-up sequences, two GHL contacts, and two email threads.
- **Booking dedup only checks Supabase, not KV:** if Supabase is unreachable when a booking is attempted (network blip), `book.js`'s duplicate guard silently can't check (returns `null`/`skipped`), and the booking proceeds and writes to KV regardless — a duplicate booking is possible specifically during a Supabase outage, which is exactly when you'd want the guard to be *more* conservative, not silently disabled.
- **Follow-up cron vs. manual "Mark Won" race:** if a lead is marked "won" in the dashboard (KV `veridian:status`) at the same moment the daily cron is mid-processing that lead's follow-up, there's no lock — a won customer could still receive a "closing your file" 14-day follow-up email if the cron read the queue before the mark-won write landed. Low probability, real business embarrassment if it happens.

## Dependency map (who calls what, today)

```
contact.js  ──writes──▶  KV (lead, leads-list, fu-queues×4)
            ──writes──▶  Supabase.leads
            ──calls───▶  GoHighLevel REST API
            ──sends───▶  Resend (team + prospect email)
            ──POSTs───▶  CONTACT_WEBHOOK_URL (optional, e.g. → itself via leads.js POST)

assessment.js ──writes──▶  KV (assessment record, lead, leads-list, fu-queues×2)
              ──sends───▶  Resend (team + client email)
              ✗ never writes Supabase — the gap in Finding #1

book.js     ──writes──▶  KV (bookings-list, booked-flag, removes from fu-queues×4)
            ──writes──▶  Supabase.bookings
            ──reads───▶  Supabase.bookings (dedup guard — Finding #3)
            ──updates─▶  Supabase.leads (status → consultation_booked)
            ──sends───▶  Resend (team + client email)

follow-up.js ──reads──▶  KV (fu-queues×4, per-lead record)
             ──writes──▶  KV (fu-log, queue removal)
             ──sends───▶  Resend
             ✗ never touches Supabase

leads.js (dashboard) ──reads──▶ KV (leads-list, booked-flag, status)
                      ──writes─▶ KV (status, on PATCH)

metrics.js (dashboard) ──reads──▶ Supabase.leads, Supabase.bookings
                        ✗ never reads KV — meaning it's missing every assessment lead (Finding #1)
```

**This is the authoritative baseline Task 2's migration design works from.**
