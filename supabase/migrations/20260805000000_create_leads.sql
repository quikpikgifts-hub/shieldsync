-- Formalizes the `leads` table that api/contact.js, api/assessment.js (as of
-- Sprint 0b), and api/metrics.js already read/write in production. This
-- schema previously existed only as whatever was configured directly in the
-- Supabase dashboard, undocumented and unreproducible — see
-- ops/veridian-data-architecture-audit.md, Finding #4.
--
-- If a `leads` table already exists in the target project with a different
-- shape, reconcile column-by-column before applying — this migration assumes
-- it is formalizing the existing live schema, not creating a new one.

CREATE TABLE IF NOT EXISTS public.leads (
  id         BIGSERIAL PRIMARY KEY,
  lead_id    TEXT UNIQUE,
  name       TEXT,
  business   TEXT,
  email      TEXT,
  phone      TEXT,
  challenge  TEXT,
  priority   TEXT,
  status     TEXT DEFAULT 'new',
  notes      TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_insert_leads"
  ON public.leads
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "service_role_select_leads"
  ON public.leads
  FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "service_role_update_leads"
  ON public.leads
  FOR UPDATE
  TO service_role
  USING (true);
