-- Server-side ticket pool (1–1500 per event). Devices download via PowerSync instead of
-- inserting 1,500 rows locally and uploading one-by-one (very slow on iPad).

create or replace function public.bikepark_seed_ticket_pool(p_event_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_event_id is null then
    return;
  end if;

  if exists (
    select 1 from public.ticket_numbers where event_id = p_event_id limit 1
  ) then
    return;
  end if;

  insert into public.ticket_numbers (id, number, status, event_id)
  select gen_random_uuid(), gs.n, 'available', p_event_id
  from generate_series(1, 1500) as gs(n);
end;
$$;

grant execute on function public.bikepark_seed_ticket_pool(uuid) to anon, authenticated;

create or replace function public.bikepark_seed_ticket_pool_on_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_active = 1 then
    perform public.bikepark_seed_ticket_pool(new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists events_seed_ticket_pool on public.events;

create trigger events_seed_ticket_pool
after insert on public.events
for each row
execute function public.bikepark_seed_ticket_pool_on_event();

-- Backfill any active event that has no pool yet (run once on deploy).
do $$
declare
  r record;
begin
  for r in select id from public.events where is_active = 1
  loop
    perform public.bikepark_seed_ticket_pool(r.id);
  end loop;
end;
$$;
