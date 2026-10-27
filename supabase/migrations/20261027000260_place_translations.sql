-- D32 / ADR-0026: a place's description is translated into the other two UI
-- languages after it is saved. The user write path does not change: the
-- definer functions still store only the original. A trigger queues the place;
-- the translate Edge Function takes queued work with translation_claim, calls a
-- machine-translation API and hands results back through translation_apply.
-- Both are service_role only and touch nothing but the four tables below.
-- Translation stays off (translation_enabled = 0) until the owner turns it on.
--
-- Not here yet: waking the function from pg_cron/pg_net (needs the hosted
-- project's secrets) and ops_health's translation block; event texts follow in
-- their own migration.

insert into app.settings (key, int_value) values
  ('translation_enabled', 0),
  ('translation_chars_per_day', 60000),
  ('translation_chars_per_month', 1500000),
  ('translation_max_attempts', 5),
  ('translation_delay_seconds', 60),
  ('translation_lease_seconds', 300),
  ('translation_batch_chars', 10000);

create table app.place_translations (
  place_id bigint not null references app.places (id) on delete cascade,
  lang app.ui_lang not null,
  description text not null check (char_length(description) between 1 and 2000),
  source_hash bytea not null check (octet_length(source_hash) = 32),
  provider text not null check (provider in ('azure', 'google', 'deepl')),
  translated_at timestamptz not null default now(),
  primary key (place_id, lang)
);

create table app.translation_jobs (
  place_id bigint primary key references app.places (id) on delete cascade,
  source_hash bytea not null,
  enqueued_at timestamptz not null default now(),
  next_attempt_at timestamptz not null,
  attempts smallint not null default 0,
  claim_id uuid,
  claimed_at timestamptz,
  last_error text check (last_error in ('quota', 'rate', 'provider', 'timeout', 'too_long', 'rejected_output', 'budget'))
);
create index translation_jobs_due on app.translation_jobs (next_attempt_at) where claim_id is null;

-- characters sent per day (UTC, the provider's month boundary), kept 90 days
create table app.translation_usage (
  day date primary key,
  chars integer not null default 0
);

create table app.translation_state (
  id integer primary key check (id = 1),
  paused_until timestamptz,
  paused_reason text check (paused_reason in ('quota', 'rate'))
);
insert into app.translation_state (id) values (1);

alter table app.place_translations enable row level security;
alter table app.translation_jobs enable row level security;
alter table app.translation_usage enable row level security;
alter table app.translation_state enable row level security;

-- Queue a place when its text or language changes; drop its translations and
-- work when it is deleted or its description emptied. Hiding changes nothing.
-- Invoker: it runs inside the definer write functions, which own the tables.
create function app.places_translation_sync() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.deleted_at is not null or new.description = '' then
    delete from app.place_translations where place_id = new.id;
    delete from app.translation_jobs where place_id = new.id;
  elsif tg_op = 'INSERT' or new.description is distinct from old.description or new.lang is distinct from old.lang then
    delete from app.place_translations where place_id = new.id;
    insert into app.translation_jobs (place_id, source_hash, next_attempt_at)
    values (new.id, pg_catalog.sha256(pg_catalog.convert_to(new.description, 'UTF8')),
            now() + pg_catalog.make_interval(secs => app.setting('translation_delay_seconds')))
    on conflict (place_id) do update
      set source_hash = excluded.source_hash, next_attempt_at = excluded.next_attempt_at,
          enqueued_at = now(), attempts = 0, claim_id = null, claimed_at = null, last_error = null;
  end if;
  return null;
end $$;
create trigger places_translation_sync after insert or update of description, deleted_at, lang on app.places
  for each row execute function app.places_translation_sync();
create trigger place_translations_version after insert or update or delete on app.place_translations
  for each statement execute function app.bump_data_version();

-- places that already have a description get queued too
insert into app.translation_jobs (place_id, source_hash, next_attempt_at)
select p.id, pg_catalog.sha256(pg_catalog.convert_to(p.description, 'UTF8')), now()
from app.places p
where p.deleted_at is null and p.description <> '';

create view public.place_translations_public with (security_invoker = false) as
select t.place_id, t.lang::text as lang, t.description
from app.place_translations t
join app.places p on p.id = t.place_id
where p.deleted_at is null and p.auto_hidden_at is null and p.suspension_hidden_at is null;

-- Take due work for the Edge Function: public places only, oldest first, within
-- the batch size and the day and month character limits. Returns the place id,
-- its description and its language, and nothing about who wrote it.
create function public.translation_claim(p_max_jobs integer) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  today date := (now() at time zone 'UTC')::date;
  st app.translation_state;
  day_used bigint;
  month_used bigint;
  batch_limit integer := app.setting('translation_batch_chars');
  day_limit integer := app.setting('translation_chars_per_day');
  month_limit integer := app.setting('translation_chars_per_month');
  lease integer := app.setting('translation_lease_seconds');
  max_attempts integer := app.setting('translation_max_attempts');
  total integer := 0;
  cost integer;
  over_budget boolean := false;
  jobs jsonb := '[]'::jsonb;
  r record;
  c uuid;
begin
  if p_max_jobs is null or p_max_jobs < 1 or p_max_jobs > 100 then return app.invalid('max_jobs'); end if;
  if app.setting('translation_enabled') = 0 then return jsonb_build_object('status', 'disabled'); end if;
  select * into st from app.translation_state where id = 1;
  if st.paused_until is not null and st.paused_until > now() then
    return jsonb_build_object('status', 'paused');
  end if;
  select coalesce(sum(u.chars), 0) into day_used from app.translation_usage u where u.day = today;
  select coalesce(sum(u.chars), 0) into month_used from app.translation_usage u
  where u.day >= pg_catalog.date_trunc('month', today)::date;

  for r in
    select j.place_id, p.description, p.lang::text as lang,
           pg_catalog.sha256(pg_catalog.convert_to(p.description, 'UTF8')) as cur_hash
    from app.translation_jobs j
    join app.places p on p.id = j.place_id
    where j.next_attempt_at <= now()
      and (j.claim_id is null or j.claimed_at < now() - pg_catalog.make_interval(secs => lease))
      and j.attempts < max_attempts
      and p.deleted_at is null and p.auto_hidden_at is null and p.suspension_hidden_at is null
      and p.description <> ''
    order by j.enqueued_at
    limit p_max_jobs
    for update of j skip locked
  loop
    cost := pg_catalog.char_length(r.description) * 2;
    if total + cost > batch_limit or day_used + total + cost > day_limit or month_used + total + cost > month_limit then
      over_budget := true;
      exit;
    end if;
    c := gen_random_uuid();
    update app.translation_jobs
    set claim_id = c, claimed_at = now(), attempts = attempts + 1, source_hash = r.cur_hash
    where place_id = r.place_id;
    total := total + cost;
    jobs := jobs || jsonb_build_array(jsonb_build_object(
      'claim', c, 'place_id', r.place_id, 'text', r.description, 'src', r.lang,
      'targets', (select jsonb_agg(l order by l) from pg_catalog.unnest(array['en', 'ja', 'ko']) l where l <> r.lang),
      'hash', pg_catalog.encode(r.cur_hash, 'hex')));
  end loop;

  if total > 0 then
    insert into app.translation_usage (day, chars) values (today, total)
    on conflict (day) do update set chars = app.translation_usage.chars + excluded.chars;
  end if;
  if over_budget and jsonb_array_length(jobs) = 0 then
    return jsonb_build_object('status', 'budget');
  end if;
  return jsonb_build_object('status', 'ok', 'jobs', jobs);
end $$;

-- Take results back. A result counts only for the claim it was given and only
-- if the description is still the text that was sent; each translation must
-- pass the same text rules as user text. Errors back off; quota and rate
-- errors pause all translation. Returns counts only.
create function public.translation_apply(p_provider text, p_results jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  item jsonb;
  o jsonb;
  pid bigint;
  cid uuid;
  j app.translation_jobs;
  p app.places;
  targets text[];
  err text;
  wrote boolean;
  stored integer := 0;
  stale integer := 0;
  rejected integer := 0;
  retried integer := 0;
begin
  if p_provider is null or p_provider not in ('azure', 'google', 'deepl') then return app.invalid('provider'); end if;
  if p_results is null or jsonb_typeof(p_results) <> 'array' or jsonb_array_length(p_results) > 100 then
    return app.invalid('results');
  end if;
  for item in select e.value from jsonb_array_elements(p_results) e loop
    if jsonb_typeof(item) <> 'object'
       or coalesce(item->>'place_id', '') !~ '^[0-9]{1,18}$'
       or coalesce(item->>'claim', '') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
      continue;
    end if;
    pid := (item->>'place_id')::bigint;
    cid := (item->>'claim')::uuid;
    select * into j from app.translation_jobs where place_id = pid and claim_id = cid for update;
    if not found then continue; end if;  -- the lease ran out or the text changed since
    select * into p from app.places where id = pid;
    if p.deleted_at is not null
       or pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(p.description, 'UTF8')), 'hex') <> coalesce(item->>'hash', '') then
      stale := stale + 1;
      update app.translation_jobs set claim_id = null, claimed_at = null where place_id = pid;
      continue;
    end if;

    err := item->>'error';
    if err is not null then
      if err not in ('quota', 'rate', 'provider', 'timeout', 'too_long') then err := 'provider'; end if;
      if err = 'quota' then
        update app.translation_state
        set paused_until = (pg_catalog.date_trunc('month', now() at time zone 'UTC') + interval '1 month') at time zone 'UTC',
            paused_reason = 'quota'
        where id = 1;
      elsif err = 'rate' then
        update app.translation_state set paused_until = now() + interval '1 hour', paused_reason = 'rate' where id = 1;
      end if;
      update app.translation_jobs
      set claim_id = null, claimed_at = null, last_error = err,
          next_attempt_at = now() + least(pg_catalog.power(2, attempts) * interval '1 minute', interval '6 hours')
      where place_id = pid;
      retried := retried + 1;
      continue;
    end if;

    targets := array(select l from pg_catalog.unnest(array['en', 'ja', 'ko']) l where l <> p.lang::text);
    wrote := false;
    if jsonb_typeof(item->'out') = 'array' then
      for o in select e.value from jsonb_array_elements(item->'out') e loop
        if jsonb_typeof(o) = 'object' and (o->>'lang') = any (targets) and app.check_text(o->>'text', 1, 2000, false) then
          insert into app.place_translations (place_id, lang, description, source_hash, provider)
          values (pid, (o->>'lang')::app.ui_lang, o->>'text',
                  pg_catalog.sha256(pg_catalog.convert_to(p.description, 'UTF8')), p_provider)
          on conflict (place_id, lang) do update
            set description = excluded.description, source_hash = excluded.source_hash,
                provider = excluded.provider, translated_at = now();
          stored := stored + 1;
          wrote := true;
        else
          rejected := rejected + 1;
        end if;
      end loop;
    end if;
    if wrote then
      delete from app.translation_jobs where place_id = pid;
    else
      update app.translation_jobs
      set claim_id = null, claimed_at = null, last_error = 'rejected_output',
          next_attempt_at = now() + least(pg_catalog.power(2, attempts) * interval '1 minute', interval '6 hours')
      where place_id = pid;
      retried := retried + 1;
    end if;
  end loop;
  return jsonb_build_object('status', 'ok', 'stored', stored, 'stale', stale, 'rejected', rejected, 'retried', retried);
end $$;

-- Grants: the view for every reader, the two functions for service_role only.
revoke all on public.place_translations_public from public, anon, authenticated, service_role;
grant select on public.place_translations_public to anon, authenticated;
revoke execute on function public.translation_claim(integer), public.translation_apply(text, jsonb),
  app.places_translation_sync() from public, anon, authenticated, service_role;
grant execute on function public.translation_claim(integer), public.translation_apply(text, jsonb) to service_role;

-- The checks migration runs before this one on a new database and never again
-- on the hosted one, so this migration checks what it changed: the same rules,
-- with the service_role list now holding the two new functions.
do $$
declare
  bad text;
  got text[];
begin
  select string_agg(c.relname, ', ') into bad from pg_catalog.pg_class c
  where c.relnamespace = 'app'::regnamespace and c.relkind = 'r'
    and (not c.relrowsecurity or exists (select 1 from pg_catalog.pg_policy p where p.polrelid = c.oid));
  if bad is not null then raise exception 'RLS on, no policy: %', bad; end if;

  select string_agg(r || ':' || c.relname, ', ') into bad
  from pg_catalog.pg_class c, unnest(array['public', 'anon', 'authenticated', 'service_role']) r
  where c.relnamespace = 'app'::regnamespace and c.relkind in ('r', 'v', 'm')
    and pg_catalog.has_table_privilege(r, c.oid, 'select,insert,update,delete,truncate,references,trigger');
  if bad is not null then raise exception 'no table rights in app: %', bad; end if;

  select array_agg(n.nspname || '.' || p.proname order by n.nspname || '.' || p.proname) into got
  from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid = p.pronamespace
  where n.nspname in ('public', 'app') and pg_catalog.has_function_privilege('service_role', p.oid, 'execute')
    and not pg_catalog.has_function_privilege('anon', p.oid, 'execute');
  if got is distinct from array['public.ops_health', 'public.translation_apply', 'public.translation_claim'] then
    raise exception 'service_role EXECUTE: %', got;
  end if;
  if pg_catalog.has_function_privilege('authenticated', 'public.translation_claim(integer)', 'execute')
     or pg_catalog.has_function_privilege('authenticated', 'public.translation_apply(text, jsonb)', 'execute') then
    raise exception 'translation functions must not be callable by clients';
  end if;

  select string_agg(n.nspname || '.' || p.proname, ', ') into bad
  from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid = p.pronamespace
  where n.nspname in ('public', 'app') and p.prosecdef
    and (not coalesce('search_path=""' = any (p.proconfig), false) or p.prosrc ~* '\mexecute\M');
  if bad is not null then raise exception 'definer functions need search_path and no dynamic SQL: %', bad; end if;

  if (select string_agg(a.attname, ',' order by a.attnum) from pg_catalog.pg_attribute a
      where a.attrelid = 'public.place_translations_public'::regclass and a.attnum > 0 and not a.attisdropped)
     is distinct from 'place_id,lang,description' then
    raise exception 'place_translations_public columns changed';
  end if;
  if pg_catalog.has_table_privilege('service_role', 'public.place_translations_public', 'select') then
    raise exception 'service_role must not read the view';
  end if;
end $$;
