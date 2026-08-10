-- Platform core: organizations + memberships (Sprint 1,
-- ops/veridian-platform-strategy.md Task 2's schema). Identity itself is
-- Supabase Auth (auth.users, managed by Supabase) — these two tables link
-- real authenticated users to an org and a role. Connect's existing
-- leads/bookings tables are untouched by this migration.

create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists memberships (
  org_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'admin', 'member')),
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);

create index if not exists memberships_user_id_idx on memberships (user_id);

alter table organizations enable row level security;
alter table memberships enable row level security;

-- Members can see the orgs they belong to.
create policy "org members can select their orgs" on organizations
  for select using (
    id in (select org_id from memberships where user_id = auth.uid())
  );

-- Members can see membership rows for orgs they belong to (so a future
-- "manage team" screen can list co-members without a schema change).
create policy "org members can select memberships in their orgs" on memberships
  for select using (
    org_id in (select org_id from memberships m2 where m2.user_id = auth.uid())
  );

-- No insert/update/delete policies: organizations and memberships are only
-- ever written by the server (api/auth/session.js) using the service-role
-- key, which bypasses RLS by design. Direct client writes are denied.
