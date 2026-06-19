CREATE TABLE IF NOT EXISTS public.bookings (
  id         BIGSERIAL PRIMARY KEY,
  booking_id TEXT UNIQUE,
  lead_id    TEXT,
  name       TEXT,
  business   TEXT,
  email      TEXT,
  phone      TEXT,
  status     TEXT DEFAULT 'confirmed',
  notes      TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_insert_bookings"
  ON public.bookings
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "service_role_select_bookings"
  ON public.bookings
  FOR SELECT
  TO service_role
  USING (true);
