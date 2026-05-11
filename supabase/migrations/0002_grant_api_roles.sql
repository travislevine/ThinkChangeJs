-- Allow PostgREST roles to read/write BikePark tables (RLS still applies on top of this).
-- Without these grants, the anon key from the browser gets "permission denied" even with RLS policies.

grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on table public.events to anon, authenticated;
grant select, insert, update, delete on table public.ticket_numbers to anon, authenticated;
grant select, insert, update, delete on table public.tickets to anon, authenticated;
grant select, insert, update, delete on table public.devices to anon, authenticated;
grant select, insert, update, delete on table public.pickup_events to anon, authenticated;
grant select, insert, update, delete on table public.pickup_event_devices to anon, authenticated;
grant select, insert, update, delete on table public.notes to anon, authenticated;
grant select, insert, update, delete on table public.archived_events to anon, authenticated;

alter default privileges in schema public grant select, insert, update, delete on tables to anon, authenticated;
