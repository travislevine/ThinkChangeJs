-- BikePark initial schema (Phase 6.1)
-- Mirrors `lib/db/schema.ts` (PowerSync schema).

create extension if not exists pgcrypto;

-- Core tables
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  name text,
  started_at bigint,
  ended_at bigint,
  is_active integer
);

create index if not exists events_active on public.events (is_active);

create table if not exists public.ticket_numbers (
  id uuid primary key default gen_random_uuid(),
  number integer,
  status text,
  event_id uuid
);

create index if not exists ticket_numbers_event on public.ticket_numbers (event_id);

create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  event_id uuid,
  ticket_number integer,
  patron_name text,
  mobile text,
  email text,
  total_devices integer,
  devices_remaining integer,
  status text,
  deleted_at bigint,
  device_id text
);

create index if not exists tickets_event on public.tickets (event_id);
create index if not exists tickets_deleted on public.tickets (deleted_at);

create table if not exists public.devices (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid,
  device_type text,
  quantity integer,
  colour text
);

create index if not exists devices_ticket on public.devices (ticket_id);

create table if not exists public.pickup_events (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid,
  devices_picked_up integer,
  picked_up_at bigint
);

create index if not exists pickup_events_ticket on public.pickup_events (ticket_id);

create table if not exists public.pickup_event_devices (
  id uuid primary key default gen_random_uuid(),
  pickup_event_id uuid,
  device_type text,
  quantity integer
);

create index if not exists pickup_event_devices_parent on public.pickup_event_devices (pickup_event_id);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid,
  content text,
  recorded_at bigint
);

create index if not exists notes_ticket on public.notes (ticket_id);

create table if not exists public.archived_events (
  id uuid primary key default gen_random_uuid(),
  event_id uuid,
  snapshot_json text,
  archived_at bigint
);

create index if not exists archived_events_event on public.archived_events (event_id);

-- Row level security (Phase 6.1: public read/write for now)
alter table public.events enable row level security;
alter table public.ticket_numbers enable row level security;
alter table public.tickets enable row level security;
alter table public.devices enable row level security;
alter table public.pickup_events enable row level security;
alter table public.pickup_event_devices enable row level security;
alter table public.notes enable row level security;
alter table public.archived_events enable row level security;

do $$
begin
  -- idempotent policies
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'events' and policyname = 'public_all') then
    create policy public_all on public.events for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'ticket_numbers' and policyname = 'public_all') then
    create policy public_all on public.ticket_numbers for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'tickets' and policyname = 'public_all') then
    create policy public_all on public.tickets for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'devices' and policyname = 'public_all') then
    create policy public_all on public.devices for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'pickup_events' and policyname = 'public_all') then
    create policy public_all on public.pickup_events for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'pickup_event_devices' and policyname = 'public_all') then
    create policy public_all on public.pickup_event_devices for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'notes' and policyname = 'public_all') then
    create policy public_all on public.notes for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'archived_events' and policyname = 'public_all') then
    create policy public_all on public.archived_events for all using (true) with check (true);
  end if;
end $$;

