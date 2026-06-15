# Veridian — GoHighLevel Deployment Plan
# Phase 5: Pipelines | Automations | Calendars | Tags | Workflows
# Source: Based on verified api/contact.js GHL integration code

---

## What's Already Built (in api/contact.js)

Every website form submission automatically:
1. Creates a contact in GHL with firstName, lastName, email, phone, companyName
2. Adds a note to the contact with full recovery data and calculator numbers
3. Tags the contact with priority level + source tags
4. Creates a pipeline opportunity (if GOHIGHLEVEL_PIPELINE_ID + STAGE_ID set)

The API uses **GHL v1 REST** (`https://rest.gohighlevel.com/v1/contacts/`).

---

## STEP 1: LOCATION SETUP

1. Log into GoHighLevel
2. Settings → Business Profile → confirm business name and timezone (Eastern — Sanford, FL)
3. Settings → API Keys → Create API Key → copy to `GOHIGHLEVEL_API_KEY`
4. Settings → Business Info → copy Location ID → set as `GOHIGHLEVEL_LOCATION_ID`

---

## STEP 2: PIPELINE SETUP

### Pipeline: Veridian Revenue Recovery

Create at: GHL → Opportunities → Pipelines → Add Pipeline

**Pipeline Name:** Revenue Recovery

**Stages (in order):**

| Stage Name | Description | What triggers it |
|---|---|---|
| New Lead | Contact form submitted, not yet contacted | Automatic from website |
| Discovery Scheduled | First call scheduled or confirmed | Manual or automation |
| Consultation Completed | 30-min call done | Manual after call |
| Proposal Sent | Proposal emailed | Manual after proposal |
| Negotiating | Prospect reviewing or asking questions | Manual |
| Won — Onboarding | Signed, setting up | Manual — mark Won in dashboard |
| Lost | Not moving forward | Manual |

After creating pipeline:
- Copy Pipeline ID from URL → set as `GOHIGHLEVEL_PIPELINE_ID`
- Copy "New Lead" Stage ID → set as `GOHIGHLEVEL_STAGE_ID`

**Monetary Value Note:**
The website API sets opportunity value to `annual_recovery × 0.10` as a proxy for estimated first-year fee. You may want to adjust this to match your actual pricing.

---

## STEP 3: CONTACT TAGS

The website creates these tags automatically. Create matching tags in GHL so they render cleanly.

### Priority Tags (auto-applied by website)

| Tag | Trigger |
|---|---|
| `HOT` | Urgent keywords OR annual recovery ≥ $200K |
| `HIGH` | Annual recovery ≥ $75K |
| `MEDIUM` | Annual recovery ≥ $25K |
| `LOW` | Below $25K or no calculator data |

### Source Tags (auto-applied by website)

| Tag | Trigger |
|---|---|
| `veridian-website` | All form submissions |
| `calculator-lead` | Used the revenue calculator before submitting |
| `direct-lead` | Contacted without using calculator |

### Manual Tags (apply yourself as pipeline progresses)

| Tag | When to apply |
|---|---|
| `client-active` | After signing — active client |
| `client-won` | After first month of service |
| `proposal-sent` | After sending proposal |
| `consultation-done` | After 30-min call |
| `do-not-contact` | Unsubscribed or asked to stop |

---

## STEP 4: AUTOMATIONS

### Automation 1: HOT Lead Alert

**Trigger:** Contact created + has tag "HOT"
**Action:** Send SMS to Steve's cell: "HOT lead just came in — [contact name] at [company]. Annual potential: [custom value from note]. Call within 1 hour."
**Delay:** Immediate

### Automation 2: New Lead Internal Notification

**Trigger:** Contact created + has tag "veridian-website"
**Action:** Internal task assigned to Steve: "New lead — review and schedule discovery call within 1 business day."
**Delay:** Immediate

### Automation 3: Discovery Call Booked (if using GHL calendar)

**Trigger:** Appointment created
**Action 1:** Send confirmation email to prospect (can duplicate what website already sends)
**Action 2:** Create task for Steve: "Prep for discovery call — review lead notes"
**Delay:** Immediately after booking

### Automation 4: Proposal Follow-Up

**Trigger:** Tag "proposal-sent" added
**Action 1 (Day 2):** Internal reminder: "Follow up on proposal to [name]"
**Action 2 (Day 5):** Send email from Steve: "Checking in on the proposal..."
**Action 3 (Day 10):** SMS from Steve: "Just wanted to make sure you received the proposal..."

### Automation 5: Won → Onboarding

**Trigger:** Opportunity moved to "Won — Onboarding" stage
**Action 1:** Add tag "client-active"
**Action 2:** Create task: "Schedule kickoff call within 24 hours"
**Action 3:** Send welcome email (see onboarding checklist for content)

---

## STEP 5: CALENDAR

**Calendar Name:** Veridian Free Consultation

**Settings:**
- Duration: 30 minutes
- Availability: Monday–Friday, 9 AM–5 PM Eastern
- Buffer time: 15 minutes between appointments
- Location: Phone call (add phone number or Zoom link)
- Confirmation email: enabled
- Reminder: 24-hour email + 1-hour SMS

**How this connects to the website:**
The website currently uses a client-side slot picker (no live calendar sync). Booking data is stored in Vercel KV and emailed to the team.

**To upgrade to GHL calendar:**
1. Create the calendar in GHL
2. Get the GHL booking URL
3. Set `BOOKING_URL` env var to the GHL booking URL
4. Follow-up emails will automatically use the GHL link instead of the website contact page

This is the recommended upgrade path — it gives real-time availability, prevents double-bookings, and integrates with automations.

---

## STEP 6: WORKFLOWS

### Workflow 1: Lead Nurture (Parallel to website follow-up)

Note: The website already sends 4 follow-up emails via Resend (24h, 3d, 7d, 14d). Do NOT create a parallel GHL email sequence for the same leads — prospects will receive duplicate emails.

**Option A (recommended):** Let website handle email follow-up. Use GHL only for SMS and internal tasks.

**Option B:** Disable website follow-up for GHL-synced leads by removing Resend key (not recommended — loses personalization).

### Workflow 2: Stale Lead Re-Engage (30-day)

**Trigger:** Contact created AND opportunity still in "New Lead" after 30 days
**Action:** Personal email from Steve: "I know timing isn't always right. Is this still something you're thinking about?"

### Workflow 3: Client Check-In (Monthly)

**Trigger:** Contact has tag "client-active" + monthly recurring
**Action:** Internal task: "Send [client name] monthly performance report"

---

## STEP 7: SMART LISTS

Create these saved smart list filters in GHL Contacts:

| List Name | Filter |
|---|---|
| Hot This Week | Tag = HOT + Created in last 7 days |
| Needs Follow-Up | Tag = veridian-website + No activity in 3 days |
| Proposals Out | Tag = proposal-sent + Not won |
| Active Clients | Tag = client-active |
| High Value Leads | Custom field annual potential > $75K |

---

## Deployment Order

1. Location setup + API keys → set env vars in Vercel → redeploy
2. Create pipeline + stages → set PIPELINE_ID + STAGE_ID env vars → redeploy
3. Create tags (at least HOT, HIGH, MEDIUM, LOW, veridian-website)
4. Test: Submit a test form on the website → verify contact appears in GHL with correct tags and note
5. Create automations (start with HOT alert — highest priority)
6. Create GHL calendar → set BOOKING_URL → test booking flow
7. Create workflows (start with stale lead re-engage)
8. Create smart lists

**First test checklist:**
- [ ] Submit contact form with calculator data → verify GHL contact created
- [ ] Verify note has calculator numbers + priority label
- [ ] Verify tags HOT/HIGH/MEDIUM/LOW applied correctly
- [ ] Verify opportunity created in correct pipeline stage
- [ ] Verify monetary value = annual × 0.10
