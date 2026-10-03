-- Run in Supabase SQL Editor before deploying. Leaves previous project tables intact.
begin;
do $migration$
declare table_name text;
begin
  foreach table_name in array array['haldi_rsvps', 'pelli_rsvps', 'vratham_rsvps'] loop
    execute format($ddl$
      create table if not exists public.%I (
        id uuid primary key default gen_random_uuid(),
        full_name text not null check (char_length(btrim(full_name)) between 2 and 80),
        contact text not null check (char_length(btrim(contact)) between 1 and 80),
        contact_key text not null unique check (char_length(contact_key) between 1 and 84),
        attending boolean not null,
        guest_count integer not null,
        message text not null default '' check (char_length(message) <= 500),
        submitted_at timestamptz not null default now(),
        updated_at timestamptz not null default now(),
        revision integer not null default 1 check (revision >= 1),
        notification_status text not null default 'pending'
          check (notification_status in ('pending', 'sent', 'failed', 'unconfigured')),
        notification_message_id text,
        notified_at timestamptz,
        check ((attending and guest_count between 1 and 30) or (not attending and guest_count = 0))
      )
    $ddl$, table_name);
    execute format('alter table public.%I enable row level security', table_name);
    execute format('revoke all on table public.%I from public, anon, authenticated', table_name);
    execute format('grant select, insert, update on table public.%I to service_role', table_name);
    execute format('create index if not exists %I on public.%I (notification_status)', table_name || '_notification_idx', table_name);
  end loop;
end;
$migration$;

-- Atomic upsert; revision protects delivery status from older concurrent requests.
create or replace function public.save_event_rsvp(event_id text, response jsonb)
returns jsonb language plpgsql security invoker set search_path = ''
as $function$
declare table_name text; saved jsonb;
begin
  table_name := case event_id
    when 'haldi' then 'haldi_rsvps'
    when 'pelli' then 'pelli_rsvps'
    when 'vratham' then 'vratham_rsvps'
    else null end;
  if table_name is null then
    raise exception 'Invalid RSVP event' using errcode = '22023';
  end if;
  execute format($upsert$
    insert into public.%I as current_response
      (full_name, contact, contact_key, attending, guest_count, message)
    values ($1->>'full_name', $1->>'contact', $1->>'contact_key',
      ($1->>'attending')::boolean, ($1->>'guest_count')::integer, coalesce($1->>'message', ''))
    on conflict (contact_key) do update set
      full_name = excluded.full_name, contact = excluded.contact,
      attending = excluded.attending, guest_count = excluded.guest_count,
      message = excluded.message, updated_at = now(),
      revision = current_response.revision + 1,
      notification_status = 'pending', notification_message_id = null, notified_at = null
    returning to_jsonb(current_response.*)
  $upsert$, table_name) into saved using response;
  return saved;
end;
$function$;
revoke all on function public.save_event_rsvp(text, jsonb) from public, anon, authenticated;
grant execute on function public.save_event_rsvp(text, jsonb) to service_role;
notify pgrst, 'reload schema';
commit;
