-- ──────────────────────────────────────────────────────────────────
-- ShieldSync Sentinel — Initial Schema
-- Supabase (PostgreSQL) · Row-Level Security enabled
-- ──────────────────────────────────────────────────────────────────

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ── TENANTS ────────────────────────────────────────────────────────
create table tenants (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  short_name  text,
  hq          text,
  license_num text,
  founded     text,
  phone       text,
  email       text,
  website     text,
  plan        text not null default 'professional', -- starter | professional | enterprise
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

alter table tenants enable row level security;
create policy "Tenant members read own tenant"
  on tenants for select using (
    id in (select tenant_id from users where auth_id = auth.uid())
  );

-- ── USERS ──────────────────────────────────────────────────────────
create table users (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  auth_id     uuid references auth.users(id),
  email       text not null,
  name        text not null,
  role        text not null check (role in ('Company Admin','Executive','Operations Manager','Dispatcher','Supervisor','Officer','Client')),
  badge       text,
  title       text,
  avatar      text,
  active      boolean not null default true,
  mfa_enabled boolean not null default false,
  created_at  timestamptz not null default now(),
  unique(tenant_id, email)
);

alter table users enable row level security;
create policy "Users read own tenant"
  on users for select using (
    tenant_id in (select tenant_id from users where auth_id = auth.uid())
  );
create policy "Admins manage users"
  on users for all using (
    exists (
      select 1 from users u
      where u.auth_id = auth.uid()
        and u.tenant_id = users.tenant_id
        and u.role = 'Company Admin'
    )
  );

-- ── SITES ──────────────────────────────────────────────────────────
create table sites (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references tenants(id) on delete cascade,
  name            text not null,
  type            text,
  client_name     text,
  address         text,
  officers_count  integer default 0,
  patrol_freq_min integer default 60,
  health_score    integer default 100,
  status          text default 'Active',
  contract_value  text,
  lat             decimal(9,6),
  lon             decimal(9,6),
  notes           text,
  created_at      timestamptz not null default now()
);

alter table sites enable row level security;
create policy "Tenant members read own sites"
  on sites for select using (
    tenant_id in (select tenant_id from users where auth_id = auth.uid())
  );
create policy "Admins and managers manage sites"
  on sites for all using (
    exists (
      select 1 from users u
      where u.auth_id = auth.uid()
        and u.tenant_id = sites.tenant_id
        and u.role in ('Company Admin', 'Operations Manager', 'Supervisor')
    )
  );

-- ── CHECKPOINTS ───────────────────────────────────────────────────
create table checkpoints (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references tenants(id) on delete cascade,
  site_id         uuid not null references sites(id) on delete cascade,
  name            text not null,
  freq_min        integer default 60,
  qr_code         text unique,
  lat             decimal(9,6),
  lon             decimal(9,6),
  active          boolean default true,
  created_at      timestamptz not null default now()
);

alter table checkpoints enable row level security;
create policy "Tenant members read checkpoints"
  on checkpoints for select using (
    tenant_id in (select tenant_id from users where auth_id = auth.uid())
  );

-- ── CHECKPOINT SCANS ──────────────────────────────────────────────
create table checkpoint_scans (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references tenants(id) on delete cascade,
  checkpoint_id   uuid not null references checkpoints(id),
  officer_id      uuid not null references users(id),
  site_id         uuid not null references sites(id),
  scanned_at      timestamptz not null default now(),
  method          text default 'QR', -- QR | NFC | Manual
  lat             decimal(9,6),
  lon             decimal(9,6),
  notes           text
);

alter table checkpoint_scans enable row level security;
create policy "Tenant members read scans"
  on checkpoint_scans for select using (
    tenant_id in (select tenant_id from users where auth_id = auth.uid())
  );
create policy "Officers insert own scans"
  on checkpoint_scans for insert with check (
    officer_id in (select id from users where auth_id = auth.uid())
  );

-- ── INCIDENTS ─────────────────────────────────────────────────────
create table incidents (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references tenants(id) on delete cascade,
  site_id         uuid not null references sites(id),
  incident_num    text not null,
  type            text not null,
  severity        text not null check (severity in ('Critical','High','Medium','Low')),
  status          text not null default 'Open' check (status in ('Open','Active','Assigned','Investigating','Resolved','Closed')),
  priority        integer default 3,
  reported_by     uuid references users(id),
  assigned_to     uuid references users(id),
  narrative       text,
  occurred_at     timestamptz not null default now(),
  resolved_at     timestamptz,
  legal_hold      boolean default false,
  created_at      timestamptz not null default now()
);

alter table incidents enable row level security;
create policy "Tenant members read incidents"
  on incidents for select using (
    tenant_id in (select tenant_id from users where auth_id = auth.uid())
  );
create policy "Officers and above manage incidents"
  on incidents for all using (
    tenant_id in (select tenant_id from users where auth_id = auth.uid())
  );

-- ── PATROL ROUTES ─────────────────────────────────────────────────
create table patrol_routes (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references tenants(id) on delete cascade,
  site_id         uuid not null references sites(id),
  name            text not null,
  freq_min        integer default 60,
  est_duration_min integer default 30,
  assigned_to     uuid references users(id),
  active          boolean default true,
  created_at      timestamptz not null default now()
);

create table patrol_route_checkpoints (
  route_id        uuid not null references patrol_routes(id) on delete cascade,
  checkpoint_id   uuid not null references checkpoints(id) on delete cascade,
  seq             integer not null,
  primary key (route_id, checkpoint_id)
);

alter table patrol_routes enable row level security;
create policy "Tenant members read patrol routes"
  on patrol_routes for select using (
    tenant_id in (select tenant_id from users where auth_id = auth.uid())
  );

-- ── PATROL SESSIONS ───────────────────────────────────────────────
create table patrol_sessions (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references tenants(id) on delete cascade,
  route_id        uuid references patrol_routes(id),
  officer_id      uuid not null references users(id),
  site_id         uuid not null references sites(id),
  started_at      timestamptz not null default now(),
  completed_at    timestamptz,
  scans_completed integer default 0,
  scans_total     integer default 0,
  compliance_pct  integer,
  status          text default 'Active' check (status in ('Active','Completed','Abandoned','Overdue'))
);

alter table patrol_sessions enable row level security;
create policy "Tenant members read patrol sessions"
  on patrol_sessions for select using (
    tenant_id in (select tenant_id from users where auth_id = auth.uid())
  );

-- ── TIMEKEEPING ───────────────────────────────────────────────────
create table time_entries (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references tenants(id) on delete cascade,
  officer_id      uuid not null references users(id),
  site_id         uuid references sites(id),
  clock_in        timestamptz,
  clock_out       timestamptz,
  hours_worked    decimal(5,2),
  hours_overtime  decimal(5,2) default 0,
  status          text default 'Open' check (status in ('Open','Approved','Pending','Rejected')),
  created_at      timestamptz not null default now()
);

alter table time_entries enable row level security;
create policy "Officers read own time entries"
  on time_entries for select using (
    officer_id in (select id from users where auth_id = auth.uid())
    or
    tenant_id in (
      select tenant_id from users where auth_id = auth.uid() and role in ('Company Admin','Operations Manager','Supervisor')
    )
  );

-- ── VEHICLES ──────────────────────────────────────────────────────
create table vehicles (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references tenants(id) on delete cascade,
  plate           text not null,
  make            text,
  year            integer,
  status          text default 'Available' check (status in ('Available','Deployed','Maintenance','Out of Service')),
  assigned_to     uuid references users(id),
  site_id         uuid references sites(id),
  fuel_pct        integer default 100,
  mileage         integer default 0,
  last_insp       date,
  condition       text default 'Good',
  has_camera      boolean default false,
  created_at      timestamptz not null default now()
);

alter table vehicles enable row level security;
create policy "Tenant members read vehicles"
  on vehicles for select using (
    tenant_id in (select tenant_id from users where auth_id = auth.uid())
  );

-- ── EQUIPMENT ─────────────────────────────────────────────────────
create table equipment (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references tenants(id) on delete cascade,
  type            text not null,
  make            text,
  serial          text,
  assigned_to     uuid references users(id),
  site_id         uuid references sites(id),
  status          text default 'Active',
  battery_pct     integer,
  last_sync       timestamptz,
  created_at      timestamptz not null default now()
);

alter table equipment enable row level security;
create policy "Tenant members read equipment"
  on equipment for select using (
    tenant_id in (select tenant_id from users where auth_id = auth.uid())
  );

-- ── VISITORS ──────────────────────────────────────────────────────
create table visitors (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references tenants(id) on delete cascade,
  site_id         uuid not null references sites(id),
  name            text not null,
  host            text,
  badge_num       text,
  purpose         text,
  checked_in_at   timestamptz,
  checked_out_at  timestamptz,
  checked_in_by   uuid references users(id),
  status          text default 'Active' check (status in ('Active','Checked Out','Denied')),
  photo_url       text,
  created_at      timestamptz not null default now()
);

alter table visitors enable row level security;
create policy "Tenant members read visitors"
  on visitors for select using (
    tenant_id in (select tenant_id from users where auth_id = auth.uid())
  );

-- ── AUDIT LOG ─────────────────────────────────────────────────────
create table audit_log (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references tenants(id) on delete cascade,
  user_id         uuid references users(id),
  action          text not null,
  detail          text,
  ip_address      inet,
  user_agent      text,
  created_at      timestamptz not null default now()
);

alter table audit_log enable row level security;
create policy "Admins read audit log"
  on audit_log for select using (
    exists (
      select 1 from users u
      where u.auth_id = auth.uid()
        and u.tenant_id = audit_log.tenant_id
        and u.role = 'Company Admin'
    )
  );
create policy "System inserts audit entries"
  on audit_log for insert with check (
    tenant_id in (select tenant_id from users where auth_id = auth.uid())
  );

-- ── LEAVE REQUESTS ────────────────────────────────────────────────
create table leave_requests (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references tenants(id) on delete cascade,
  officer_id      uuid not null references users(id),
  type            text not null,
  start_date      date not null,
  end_date        date not null,
  days            integer,
  reason          text,
  status          text default 'Pending' check (status in ('Pending','Approved','Denied')),
  reviewed_by     uuid references users(id),
  reviewed_at     timestamptz,
  created_at      timestamptz not null default now()
);

alter table leave_requests enable row level security;
create policy "Officers read own leave"
  on leave_requests for select using (
    officer_id in (select id from users where auth_id = auth.uid())
    or
    tenant_id in (
      select tenant_id from users where auth_id = auth.uid() and role in ('Company Admin','Operations Manager','Supervisor')
    )
  );

-- ── TRAINING RECORDS ──────────────────────────────────────────────
create table training_records (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references tenants(id) on delete cascade,
  officer_id      uuid not null references users(id),
  course          text not null,
  provider        text,
  completed_at    date,
  expires_at      date,
  cert_num        text,
  status          text default 'Active' check (status in ('Active','Expired','Pending','Waived')),
  created_at      timestamptz not null default now()
);

alter table training_records enable row level security;
create policy "Tenant members read training"
  on training_records for select using (
    tenant_id in (select tenant_id from users where auth_id = auth.uid())
  );

-- ── DAR REPORTS ───────────────────────────────────────────────────
create table dar_reports (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references tenants(id) on delete cascade,
  site_id         uuid not null references sites(id),
  officer_id      uuid not null references users(id),
  report_date     date not null default current_date,
  shift_start     time,
  shift_end       time,
  patrols_done    integer default 0,
  checkpoints_done integer default 0,
  incidents_count integer default 0,
  summary         text,
  status          text default 'Draft' check (status in ('Draft','Submitted','Reviewed','Approved')),
  supervisor_id   uuid references users(id),
  created_at      timestamptz not null default now()
);

alter table dar_reports enable row level security;
create policy "Officers read own DARs"
  on dar_reports for select using (
    officer_id in (select id from users where auth_id = auth.uid())
    or
    tenant_id in (
      select tenant_id from users where auth_id = auth.uid()
        and role in ('Company Admin','Operations Manager','Supervisor')
    )
  );

-- ── AI ALERTS ─────────────────────────────────────────────────────
create table ai_alerts (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references tenants(id) on delete cascade,
  site_id         uuid references sites(id),
  severity        text not null check (severity in ('Critical','Warning','Info')),
  message         text not null,
  action_label    text,
  dismissed_by    uuid references users(id),
  dismissed_at    timestamptz,
  created_at      timestamptz not null default now()
);

alter table ai_alerts enable row level security;
create policy "Tenant members read alerts"
  on ai_alerts for select using (
    tenant_id in (select tenant_id from users where auth_id = auth.uid())
  );

-- ── USEFUL INDEXES ────────────────────────────────────────────────
create index idx_checkpoint_scans_tenant on checkpoint_scans(tenant_id, scanned_at desc);
create index idx_incidents_tenant_status on incidents(tenant_id, status, occurred_at desc);
create index idx_time_entries_officer on time_entries(officer_id, clock_in desc);
create index idx_patrol_sessions_officer on patrol_sessions(officer_id, started_at desc);
create index idx_audit_log_tenant on audit_log(tenant_id, created_at desc);
create index idx_users_tenant on users(tenant_id);
create index idx_sites_tenant on sites(tenant_id);
