-- Billing skeleton (Sprint 2, ops/veridian-platform-strategy.md Task 2's
-- schema). Schema + plumbing only — no Stripe keys exist yet (see
-- ACTIVATION.md), so nothing here can charge anyone. Going live (real
-- prices, real checkout) is Sprint 5, gated on a founder pricing decision.

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text,
  status text not null default 'none' check (status in ('none', 'trialing', 'active', 'past_due', 'canceled')),
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists subscriptions_org_id_idx on subscriptions (org_id);
create index if not exists subscriptions_stripe_customer_id_idx on subscriptions (stripe_customer_id);

create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  stripe_invoice_id text not null unique,
  amount_cents integer not null,
  currency text not null default 'usd',
  status text not null,
  period_start timestamptz,
  period_end timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists invoices_org_id_idx on invoices (org_id);

create table if not exists product_entitlements (
  org_id uuid not null references organizations(id) on delete cascade,
  product_key text not null check (product_key in ('connect', 'social')),
  status text not null default 'unmetered' check (status in ('unmetered', 'trialing', 'active', 'past_due', 'canceled')),
  updated_at timestamptz not null default now(),
  primary key (org_id, product_key)
);

alter table subscriptions enable row level security;
alter table invoices enable row level security;
alter table product_entitlements enable row level security;

create policy "org members can select their own subscription" on subscriptions
  for select using (org_id in (select org_id from memberships where user_id = auth.uid()));

create policy "org members can select their own invoices" on invoices
  for select using (org_id in (select org_id from memberships where user_id = auth.uid()));

create policy "org members can select their own entitlements" on product_entitlements
  for select using (org_id in (select org_id from memberships where user_id = auth.uid()));

-- No insert/update/delete policies: all three tables are written only by
-- the server (api/billing/webhook.js, via the service-role key) reacting
-- to real Stripe events — never by a direct client write.
