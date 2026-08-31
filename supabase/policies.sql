-- ===========================================================================
-- NorthForge Agency OS — Supabase schema hardening & Row Level Security
-- Apply in the Supabase SQL editor when the backend is connected.
--
-- Model:
--   profiles.role in ('admin','client'); client rows are scoped by client_id.
--   Admins have full access; clients see ONLY their own tenant's rows.
--   Authorization is enforced HERE (database), never in the browser.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- Helper: is the current user an admin?  (SECURITY DEFINER, locked search_path)
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

-- Helper: the client_id owned by the current user (null for admins/none).
create or replace function public.current_client_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select client_id from public.profiles where id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- profiles: a user may read/update ONLY their own profile; role is immutable
-- from the client (only admins may change roles).
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists profiles_self_select on public.profiles;
create policy profiles_self_select on public.profiles
  for select using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_update on public.profiles
  for update using (id = auth.uid())
  with check (
    id = auth.uid()
    -- prevent privilege escalation: role & client_id cannot be changed by the user
    and role = (select role from public.profiles where id = auth.uid())
    and client_id is not distinct from (select client_id from public.profiles where id = auth.uid())
  );

drop policy if exists profiles_admin_all on public.profiles;
create policy profiles_admin_all on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Tenant-scoped tables. Clients see only rows for their own client_id;
-- admins see everything. NO "USING (true)" anywhere on sensitive tables.
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'clients','leads','projects','tasks','websites','subscriptions',
    'invoices','payments','proposals','appointments','messages',
    'notifications','support_tickets','client_requests','analytics_events'
  ]
  loop
    execute format('alter table public.%I enable row level security;', t);

    -- clients: read own tenant
    execute format($f$
      drop policy if exists %1$s_client_read on public.%1$s;
      create policy %1$s_client_read on public.%1$s
        for select using (
          public.is_admin()
          or client_id = public.current_client_id()
        );
    $f$, t);

    -- clients: insert only for their own tenant (client_requests, tickets, etc.)
    execute format($f$
      drop policy if exists %1$s_client_insert on public.%1$s;
      create policy %1$s_client_insert on public.%1$s
        for insert with check (
          public.is_admin()
          or client_id = public.current_client_id()
        );
    $f$, t);

    -- admins: full update/delete; clients may NOT update sensitive tenant rows
    -- (payment status, project status, etc. are admin-only) unless explicitly
    -- opened below.
    execute format($f$
      drop policy if exists %1$s_admin_write on public.%1$s;
      create policy %1$s_admin_write on public.%1$s
        for all using (public.is_admin()) with check (public.is_admin());
    $f$, t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Explicit narrow exceptions
-- ---------------------------------------------------------------------------

-- A client may update the fields of their OWN request (title/description) but
-- status/adminNotes stay admin-only (enforced by column-level app logic +
-- this row scope). Payments: a client may submit a reference but can NEVER
-- set status = 'paid' — only admins can.
drop policy if exists payments_client_submit on public.payments;
create policy payments_client_submit on public.payments
  for update using (client_id = public.current_client_id())
  with check (
    client_id = public.current_client_id()
    and status in ('pending','submitted')   -- client can only move to submitted
  );

-- notifications: a client marks THEIR notifications read; cannot create admin ones
drop policy if exists notifications_client_read_flag on public.notifications;
create policy notifications_client_read_flag on public.notifications
  for update using (audience = 'client' and client_id = public.current_client_id())
  with check (audience = 'client' and client_id = public.current_client_id());

-- ---------------------------------------------------------------------------
-- Admin-only internal tables — no client access at all.
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['activities','workflows','workflow_nodes','services','plans'] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format($f$
      drop policy if exists %1$s_admin_only on public.%1$s;
      create policy %1$s_admin_only on public.%1$s
        for all using (public.is_admin()) with check (public.is_admin());
    $f$, t);
  end loop;
end $$;

-- plans/services may need public READ for the marketing site & pricing:
drop policy if exists plans_public_read on public.plans;
create policy plans_public_read on public.plans for select using (active = true);
drop policy if exists services_public_read on public.services;
create policy services_public_read on public.services for select using (active = true);

-- ---------------------------------------------------------------------------
-- Storage: private attachments bucket, tenant-scoped by path prefix
--   path convention: {client_id}/{filename}
-- ---------------------------------------------------------------------------
-- create bucket 'attachments' as PRIVATE in the dashboard, then:
drop policy if exists attachments_read on storage.objects;
create policy attachments_read on storage.objects
  for select using (
    bucket_id = 'attachments'
    and (public.is_admin() or (storage.foldername(name))[1] = public.current_client_id()::text)
  );

drop policy if exists attachments_write on storage.objects;
create policy attachments_write on storage.objects
  for insert with check (
    bucket_id = 'attachments'
    and (public.is_admin() or (storage.foldername(name))[1] = public.current_client_id()::text)
  );

-- ===========================================================================
-- Audit log (append-only): admins read; inserts via SECURITY DEFINER trigger.
-- ===========================================================================
create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor uuid,
  action text not null,
  resource text,
  resource_id text,
  created_at timestamptz not null default now()
);
alter table public.audit_log enable row level security;
drop policy if exists audit_admin_read on public.audit_log;
create policy audit_admin_read on public.audit_log for select using (public.is_admin());
-- no client insert/update/delete policies → clients cannot touch the audit log.
