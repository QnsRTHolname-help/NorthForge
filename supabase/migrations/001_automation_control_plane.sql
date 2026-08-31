-- ===========================================================================
-- NorthForge — Automation Control Plane schema (Phase 3)
--
-- Model rules (from the master spec):
--   * Hermes is the execution authority. The website only records state that
--     Hermes/backend events legitimately produce. The browser can NEVER write
--     job state (clients have no INSERT/UPDATE policies on job tables at all;
--     writes happen exclusively via server routes using the service role).
--   * A state-machine trigger enforces legal transitions at the DB level.
--   * Every job stores a CONFIGURATION SNAPSHOT (slug + version + config)
--     so later edits/republishes never alter old jobs.
--   * Hermes events are idempotent: unique on (source, event_id).
-- Apply in the Supabase SQL editor (after policies.sql baseline exists).
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- Automation definitions (the reusable "what can run" catalog)
-- ---------------------------------------------------------------------------
create table if not exists public.automation_definitions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  category text,
  enabled boolean not null default true,
  archived boolean not null default false,
  current_version_id uuid,               -- set when a version is published
  input_schema jsonb not null default '[]'::jsonb,   -- schema-driven field list
  config_schema jsonb not null default '[]'::jsonb,
  output_schema jsonb not null default '{}'::jsonb,
  capabilities jsonb not null default '{}'::jsonb,
  -- capabilities: {supportsProgress,supportsRealtime,supportsCancel,
  --                supportsPause,supportsResume,supportsFiles,supportsStreaming}
  permissions jsonb not null default '{}'::jsonb,    -- which clients/plans may run it
  notification_rules jsonb not null default '{}'::jsonb,
  hermes_automation_key text,            -- how Hermes identifies it (contract TBD)
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Automation versions (DRAFT / ACTIVE / ARCHIVED). Jobs pin an exact version.
-- ---------------------------------------------------------------------------
create table if not exists public.automation_versions (
  id uuid primary key default gen_random_uuid(),
  automation_id uuid not null references public.automation_definitions(id) on delete cascade,
  version int not null,
  config jsonb not null default '{}'::jsonb,
  input_schema jsonb not null default '[]'::jsonb,
  output_schema jsonb not null default '{}'::jsonb,
  change_summary text,
  status text not null default 'DRAFT' check (status in ('DRAFT','ACTIVE','ARCHIVED')),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  published_at timestamptz,
  unique (automation_id, version)
);

create unique index if not exists one_active_version_per_automation
  on public.automation_versions (automation_id) where status = 'ACTIVE';

-- Publishing a version makes it current (and archives the previous current).
create or replace function public.fn_on_version_published()
returns trigger language plpgsql as $$
begin
  if new.status = 'ACTIVE' and (old.status is distinct from 'ACTIVE') then
    update public.automation_versions
      set status = 'ARCHIVED'
      where automation_id = new.automation_id and status = 'ACTIVE' and id <> new.id;
    update public.automation_definitions
      set current_version_id = new.id, updated_at = now()
      where id = new.automation_id;
  end if;
  return new;
end $$;

drop trigger if exists trg_version_published on public.automation_versions;
create trigger trg_version_published
  after update of status on public.automation_versions
  for each row execute function public.fn_on_version_published();

-- ---------------------------------------------------------------------------
-- Automation jobs (the heart of the control plane)
-- ---------------------------------------------------------------------------
create table if not exists public.automation_jobs (
  id uuid primary key default gen_random_uuid(),
  hermes_job_id text,                       -- filled from Hermes (never invented)
  client_id uuid not null references public.clients(id),
  created_by uuid references public.profiles(id),
  automation_id uuid not null references public.automation_definitions(id),
  automation_version_id uuid references public.automation_versions(id),
  config_snapshot jsonb not null default '{}'::jsonb,
  -- snapshot: {slug, name, version, config, capabilities} frozen at creation
  input jsonb not null default '{}'::jsonb,
  status text not null default 'DRAFT',
  progress int not null default 0 check (progress between 0 and 100),
  priority text not null default 'NORMAL' check (priority in ('LOW','NORMAL','HIGH','URGENT')),
  current_stage text,
  current_task text,
  attempt int not null default 1,
  retry_of uuid references public.automation_jobs(id),
  queued_at timestamptz,
  dispatched_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  failure jsonb,                            -- {code, message} safe fields only
  result_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists jobs_client_idx on public.automation_jobs (client_id, created_at desc);
create index if not exists jobs_status_idx on public.automation_jobs (status, created_at desc);
create index if not exists jobs_automation_idx on public.automation_jobs (automation_id, created_at desc);
create index if not exists jobs_hermes_idx on public.automation_jobs (hermes_job_id)
  where hermes_job_id is not null;

-- ---------------------------------------------------------------------------
-- Job state machine — enforced in the database, not the browser.
-- Only the backend (service role) may transition jobs.
-- ---------------------------------------------------------------------------
create or replace function public.fn_is_service_role()
returns boolean language sql stable as $$
  select coalesce(current_setting('request.jwt.claims', true)::jsonb ->> 'role', 'anon') = 'service_role';
$$;

create or replace function public.fn_valid_job_transition()
returns trigger language plpgsql as $$
declare
  allowed text[] :=
    array['QUEUED','DISPATCHING','ACCEPTED','RUNNING','WAITING',
          'CANCELLING','COMPLETED','FAILED','CANCELLED'];
begin
  if tg_op = 'INSERT' then
    if new.status not in ('DRAFT','QUEUED') then
      raise exception 'ILLEGAL_INITIAL_STATE: %', new.status;
    end if;
    return new;
  end if;

  if new.status = old.status then return new; end if;

  if not public.fn_is_service_role() then
    raise exception 'JOB_STATE_IS_SERVER_CONTROLLED';
  end if;

  if not (new.status = any(allowed)) then
    raise exception 'UNKNOWN_JOB_STATE: %', new.status;
  end if;

  case old.status
    when 'DRAFT' then
      if new.status <> 'QUEUED' then
        raise exception 'ILLEGAL_TRANSITION: % -> %', old.status, new.status; end if;
    when 'QUEUED' then
      if new.status not in ('DISPATCHING','CANCELLED','FAILED') then
        raise exception 'ILLEGAL_TRANSITION: % -> %', old.status, new.status; end if;
    when 'DISPATCHING' then
      -- QUEUED here = dispatch failed, back off and retry later
      if new.status not in ('ACCEPTED','QUEUED','FAILED') then
        raise exception 'ILLEGAL_TRANSITION: % -> %', old.status, new.status; end if;
    when 'ACCEPTED' then
      if new.status not in ('RUNNING','CANCELLING','FAILED','CANCELLED') then
        raise exception 'ILLEGAL_TRANSITION: % -> %', old.status, new.status; end if;
    when 'RUNNING','WAITING' then
      if new.status not in ('RUNNING','WAITING','CANCELLING','COMPLETED','FAILED','CANCELLED') then
        raise exception 'ILLEGAL_TRANSITION: % -> %', old.status, new.status; end if;
    when 'CANCELLING' then
      if new.status not in ('CANCELLED','FAILED') then
        raise exception 'ILLEGAL_TRANSITION: % -> %', old.status, new.status; end if;
    else
      -- COMPLETED / FAILED / CANCELLED are terminal. No resurrection.
      raise exception 'TERMINAL_STATE: % cannot transition to %', old.status, new.status;
  end case;

  -- Maintain timestamps consistently with state.
  if new.queued_at is null and new.status <> 'DRAFT' then new.queued_at := now(); end if;
  if new.status = 'DISPATCHING' then new.dispatched_at := now(); end if;
  if new.status = 'RUNNING' and old.started_at is null then new.started_at := now(); end if;
  if new.status in ('COMPLETED','FAILED','CANCELLED') then new.completed_at := now(); end if;
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists trg_job_state_machine on public.automation_jobs;
create trigger trg_job_state_machine
  before insert or update of status on public.automation_jobs
  for each row execute function public.fn_valid_job_transition();

-- ---------------------------------------------------------------------------
-- Hermes events (idempotent + orderable)
-- ---------------------------------------------------------------------------
create table if not exists public.automation_events (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.automation_jobs(id) on delete cascade,
  event_id text,                            -- Hermes idempotency key (may be null)
  source text not null default 'hermes',
  type text not null,
  seq bigint,                               -- Hermes sequence number if provided
  visibility text not null default 'internal' check (visibility in ('client','internal')),
  client_message text,                      -- safe human-readable line for clients
  payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz,
  received_at timestamptz not null default now(),
  unique (source, event_id)
);
create index if not exists events_job_idx on public.automation_events (job_id, received_at desc);

-- ---------------------------------------------------------------------------
-- Results, files, logs
-- ---------------------------------------------------------------------------
create table if not exists public.automation_results (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null unique references public.automation_jobs(id) on delete cascade,
  client_id uuid not null references public.clients(id),
  summary text,
  key_findings jsonb not null default '[]'::jsonb,
  metrics jsonb not null default '{}'::jsonb,
  recommendations jsonb not null default '[]'::jsonb,
  raw jsonb not null default '{}'::jsonb,   -- authoritative Hermes output
  ai_summary text,                          -- Nemotron-generated, labelled in UI
  ai_summary_model text,
  ai_summary_at timestamptz,                -- cache freshness for AI summaries
  created_at timestamptz not null default now()
);

create table if not exists public.automation_files (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.automation_jobs(id) on delete cascade,
  client_id uuid not null references public.clients(id),
  file_name text not null,
  mime_type text,
  size_bytes bigint,
  storage_path text not null,               -- private bucket path, never raw FS path
  created_at timestamptz not null default now()
);

create table if not exists public.automation_logs (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.automation_jobs(id) on delete cascade,
  level text not null default 'info' check (level in ('info','warn','error')),
  message text not null,
  detail jsonb not null default '{}'::jsonb,  -- internal/technical; admin-only
  created_at timestamptz not null default now()
);
create index if not exists logs_job_idx on public.automation_logs (job_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Hermes connection health (real heartbeats only; UNKNOWN until Hermes reports)
-- ---------------------------------------------------------------------------
create table if not exists public.hermes_connections (
  id text primary key default 'default',
  status text not null default 'UNKNOWN' check (status in ('ONLINE','DEGRADED','OFFLINE','UNKNOWN')),
  last_heartbeat timestamptz,
  last_error text,
  meta jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ===========================================================================
-- RLS — same tenant model as policies.sql. Clients read their own jobs/
-- events/results/files. ALL writes to job state go through the service role.
-- ===========================================================================
alter table public.automation_definitions enable row level security;
alter table public.automation_versions   enable row level security;
alter table public.automation_jobs       enable row level security;
alter table public.automation_events     enable row level security;
alter table public.automation_results    enable row level security;
alter table public.automation_files      enable row level security;
alter table public.automation_logs       enable row level security;
alter table public.hermes_connections    enable row level security;

-- Definitions/versions: readable by authenticated users (clients need the
-- catalog to see what they can run); writable by admins only.
drop policy if exists automations_read on public.automation_definitions;
create policy automations_read on public.automation_definitions
  for select using (not archived);
drop policy if exists automations_admin_write on public.automation_definitions;
create policy automations_admin_write on public.automation_definitions
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists versions_read on public.automation_versions;
create policy versions_read on public.automation_versions
  for select using (true);
drop policy if exists versions_admin_write on public.automation_versions;
create policy versions_admin_write on public.automation_versions
  for all using (public.is_admin()) with check (public.is_admin());

-- Jobs: client reads own tenant; admins read all; NO client insert/update.
drop policy if exists jobs_client_read on public.automation_jobs;
create policy jobs_client_read on public.automation_jobs
  for select using (client_id = public.current_client_id());
drop policy if exists jobs_admin_read on public.automation_jobs;
create policy jobs_admin_read on public.automation_jobs
  for select using (public.is_admin());

-- Events: clients see only client-visibility events for their own jobs.
drop policy if exists events_client_read on public.automation_events;
create policy events_client_read on public.automation_events
  for select using (
    visibility = 'client' and exists (
      select 1 from public.automation_jobs j
      where j.id = job_id and j.client_id = public.current_client_id()
    )
  );
drop policy if exists events_admin_read on public.automation_events;
create policy events_admin_read on public.automation_events
  for select using (public.is_admin());

-- Results/files: tenant-scoped reads, admin full read. No client writes.
drop policy if exists results_client_read on public.automation_results;
create policy results_client_read on public.automation_results
  for select using (client_id = public.current_client_id());
drop policy if exists results_admin_read on public.automation_results;
create policy results_admin_read on public.automation_results
  for select using (public.is_admin());

drop policy if exists files_client_read on public.automation_files;
create policy files_client_read on public.automation_files
  for select using (client_id = public.current_client_id());
drop policy if exists files_admin_read on public.automation_files;
create policy files_admin_read on public.automation_files
  for select using (public.is_admin());

-- Logs: admin-only (internal technical detail — never exposed to clients).
drop policy if exists logs_admin_read on public.automation_logs;
create policy logs_admin_read on public.automation_logs
  for select using (public.is_admin());

-- Hermes health: admin-only.
drop policy if exists hermes_admin_read on public.hermes_connections;
create policy hermes_admin_read on public.hermes_connections
  for select using (public.is_admin());




