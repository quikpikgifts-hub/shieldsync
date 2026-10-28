create extension if not exists pgcrypto;
create table if not exists public.qp_competitors (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade,
 name text not null, platform text not null, niche text not null default '', profile_url text, notes text not null default '',
 created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists public.qp_video_briefs (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade,
 title text not null, topic text not null default '', source_url text, platform text not null, hook text not null default '',
 caption text not null default '', hashtags text not null default '', evidence_notes text not null default '',
 quality_score integer not null default 0 check(quality_score between 0 and 100),
 status text not null default 'Needs review' check(status in ('Needs review','Needs revision','Approved','Rejected','Published')),
 approved_by uuid references auth.users(id), approved_at timestamptz, published_url text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(status <> 'Approved' or (quality_score >= 90 and source_url is not null and length(trim(evidence_notes)) > 0)));
create table if not exists public.qp_hashtag_evidence (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade,
 tag text not null, platform text not null, topic text not null default '', source_url text, evidence_notes text not null default '',
 confidence text not null default 'Relevant, unvalidated' check(confidence in ('Relevant, unvalidated','Observed on competitor','Measured on own post','Repeatedly validated')),
 observed_views bigint check(observed_views is null or observed_views >= 0), observed_engagement bigint check(observed_engagement is null or observed_engagement >= 0),
 captured_at timestamptz not null default now());
create table if not exists public.qp_performance_snapshots (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade,
 video_id uuid not null references public.qp_video_briefs(id) on delete cascade, platform text not null,
 captured_at timestamptz not null default now(), interval_label text not null default 'Unspecified',
 views bigint not null default 0 check(views >= 0), likes bigint not null default 0 check(likes >= 0),
 shares bigint not null default 0 check(shares >= 0), comments bigint not null default 0 check(comments >= 0),
 saves bigint not null default 0 check(saves >= 0), follows bigint not null default 0 check(follows >= 0),
 watch_time_seconds numeric, completion_rate numeric check(completion_rate is null or (completion_rate between 0 and 100)), notes text not null default '');
create table if not exists public.qp_approval_events (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade,
 video_id uuid not null references public.qp_video_briefs(id) on delete cascade, actor_id uuid references auth.users(id),
 action text not null check(action in ('submitted','revision_requested','approved','rejected','published')),
 quality_score integer check(quality_score is null or quality_score between 0 and 100), notes text not null default '', created_at timestamptz not null default now());
create index if not exists qp_competitors_owner_idx on public.qp_competitors(owner_id);
create index if not exists qp_video_briefs_owner_status_idx on public.qp_video_briefs(owner_id,status);
create index if not exists qp_hashtag_evidence_owner_tag_idx on public.qp_hashtag_evidence(owner_id,tag);
create index if not exists qp_performance_video_captured_idx on public.qp_performance_snapshots(video_id,captured_at desc);
create index if not exists qp_approval_video_created_idx on public.qp_approval_events(video_id,created_at desc);
alter table public.qp_competitors enable row level security;
alter table public.qp_video_briefs enable row level security;
alter table public.qp_hashtag_evidence enable row level security;
alter table public.qp_performance_snapshots enable row level security;
alter table public.qp_approval_events enable row level security;
create policy "Owner manages competitors" on public.qp_competitors for all to authenticated using(owner_id=auth.uid()) with check(owner_id=auth.uid());
create policy "Owner manages video briefs" on public.qp_video_briefs for all to authenticated using(owner_id=auth.uid()) with check(owner_id=auth.uid());
create policy "Owner manages hashtag evidence" on public.qp_hashtag_evidence for all to authenticated using(owner_id=auth.uid()) with check(owner_id=auth.uid());
create policy "Owner manages performance snapshots" on public.qp_performance_snapshots for all to authenticated using(owner_id=auth.uid()) with check(owner_id=auth.uid());
create policy "Owner manages approval events" on public.qp_approval_events for all to authenticated using(owner_id=auth.uid()) with check(owner_id=auth.uid());
comment on table public.qp_hashtag_evidence is 'Hashtag relevance is distinct from proven performance.';
comment on table public.qp_approval_events is 'Audit trail for human approval and publishing decisions.';
