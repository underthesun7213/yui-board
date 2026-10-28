-- TR-Q2 / D32: an event's title, place and body are translated into the other
-- two UI languages, through the same pipeline as place descriptions
-- (ADR-0026): a trigger queues the event, the translate Edge Function takes the
-- work with translation_claim and hands results back with translation_apply.
-- The two functions are replaced here so one claim carries both kinds of work
-- under one character budget; the place path behaves exactly as before.
--
-- Not translated: one week's override of a weekly event (shown as written; the
-- app shows the series translation only for the fields that week left alone),
-- events that are already over, and .ics files (they leave the device).

create table app.event_translations (
  event_id bigint not null references app.events (id) on delete cascade,
  lang app.ui_lang not null,
  title text not null check (char_length(title) between 1 and 200),
  place_text text not null check (char_length(place_text) <= 200),
  body text not null check (char_length(body) <= 2000),
  source_hash bytea not null check (octet_length(source_hash) = 32),
  provider text not null check (provider in ('azure', 'google', 'deepl')),
  translated_at timestamptz not null default now(),
  primary key (event_id, lang)
);

create table app.event_translation_jobs (
  event_id bigint primary key references app.events (id) on delete cascade,
  source_hash bytea not null,
  enqueued_at timestamptz not null default now(),
  next_attempt_at timestamptz not null,
  attempts smallint not null default 0,
  claim_id uuid,
  claimed_at timestamptz,
  last_error text check (last_error in ('quota', 'rate', 'provider', 'timeout', 'too_long', 'rejected_output', 'budget'))
);
create index event_translation_jobs_due on app.event_translation_jobs (next_attempt_at) where claim_id is null;

alter table app.event_translations enable row level security;
alter table app.event_translation_jobs enable row level security;

-- The three texts as one value. The separator (U+001F) cannot occur in any of
-- them: the write rules refuse it in single-line and multi-line text alike.
create function app.event_text_hash(p_title text, p_place_text text, p_body text) returns bytea
language sql immutable set search_path = '' as $$
  select pg_catalog.sha256(pg_catalog.convert_to(p_title || chr(31) || p_place_text || chr(31) || p_body, 'UTF8'))
$$;

-- Queue an event when its texts or language change, or when it comes back from
-- deletion; drop its translations and work when it is deleted. Hiding changes
-- nothing. Invoker: it runs inside the definer write functions.
create function app.events_translation_sync() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.deleted_at is not null then
    delete from app.event_translations where event_id = new.id;
    delete from app.event_translation_jobs where event_id = new.id;
  elsif tg_op = 'INSERT' or old.deleted_at is not null
        or new.title is distinct from old.title or new.place_text is distinct from old.place_text
        or new.body is distinct from old.body or new.lang is distinct from old.lang then
    delete from app.event_translations where event_id = new.id;
    insert into app.event_translation_jobs (event_id, source_hash, next_attempt_at)
    values (new.id, app.event_text_hash(new.title, new.place_text, new.body),
            now() + pg_catalog.make_interval(secs => app.setting('translation_delay_seconds')))
    on conflict (event_id) do update
      set source_hash = excluded.source_hash, next_attempt_at = excluded.next_attempt_at,
          enqueued_at = now(), attempts = 0, claim_id = null, claimed_at = null, last_error = null;
  end if;
  return null;
end $$;
create trigger events_translation_sync after insert or update of title, place_text, body, deleted_at, lang on app.events
  for each row execute function app.events_translation_sync();
create trigger event_translations_version after insert or update or delete on app.event_translations
  for each statement execute function app.bump_data_version();

-- events that are not over yet get queued too
insert into app.event_translation_jobs (event_id, source_hash, next_attempt_at)
select e.id, app.event_text_hash(e.title, e.place_text, e.body), now()
from app.events e
where e.deleted_at is null and e.last_date >= (now() at time zone 'Asia/Tokyo')::date;

-- Same conditions as events_public, so a translation is public exactly when
-- its event is.
create view public.event_translations_public with (security_invoker = false) as
select t.event_id, t.lang::text as lang, t.title, t.place_text, t.body
from app.event_translations t
join app.events e on e.id = t.event_id
where e.deleted_at is null and e.auto_hidden_at is null and e.suspension_hidden_at is null
  and e.last_date >= (now() at time zone 'Asia/Tokyo')::date - 365;

-- Take due work: events first (they stop mattering once they are over), then
-- places, oldest first within each, all within one batch size and the day and
-- month character limits. An event job carries its non-empty texts by name.
create or replace function public.translation_claim(p_max_jobs integer) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  today date := (now() at time zone 'UTC')::date;
  tokyo_today date := (now() at time zone 'Asia/Tokyo')::date;
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
  texts jsonb;
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
    select j.event_id, e.title, e.place_text, e.body, e.lang::text as lang,
           app.event_text_hash(e.title, e.place_text, e.body) as cur_hash
    from app.event_translation_jobs j
    join app.events e on e.id = j.event_id
    where j.next_attempt_at <= now()
      and (j.claim_id is null or j.claimed_at < now() - pg_catalog.make_interval(secs => lease))
      and j.attempts < max_attempts
      and e.deleted_at is null and e.auto_hidden_at is null and e.suspension_hidden_at is null
      and e.last_date >= tokyo_today
    order by j.enqueued_at
    limit p_max_jobs
    for update of j skip locked
  loop
    cost := (pg_catalog.char_length(r.title) + pg_catalog.char_length(r.place_text) + pg_catalog.char_length(r.body)) * 2;
    if total + cost > batch_limit or day_used + total + cost > day_limit or month_used + total + cost > month_limit then
      over_budget := true;
      exit;
    end if;
    c := gen_random_uuid();
    update app.event_translation_jobs
    set claim_id = c, claimed_at = now(), attempts = attempts + 1, source_hash = r.cur_hash
    where event_id = r.event_id;
    total := total + cost;
    texts := jsonb_build_object('title', r.title);
    if r.place_text <> '' then texts := texts || jsonb_build_object('place_text', r.place_text); end if;
    if r.body <> '' then texts := texts || jsonb_build_object('body', r.body); end if;
    jobs := jobs || jsonb_build_array(jsonb_build_object(
      'claim', c, 'event_id', r.event_id, 'texts', texts, 'src', r.lang,
      'targets', (select jsonb_agg(l order by l) from pg_catalog.unnest(array['en', 'ja', 'ko']) l where l <> r.lang),
      'hash', pg_catalog.encode(r.cur_hash, 'hex')));
  end loop;

  if not over_budget and jsonb_array_length(jobs) < p_max_jobs then
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
      limit p_max_jobs - jsonb_array_length(jobs)
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
  end if;

  if total > 0 then
    insert into app.translation_usage (day, chars) values (today, total)
    on conflict (day) do update set chars = app.translation_usage.chars + excluded.chars;
  end if;
  if over_budget and jsonb_array_length(jobs) = 0 then
    return jsonb_build_object('status', 'budget');
  end if;
  return jsonb_build_object('status', 'ok', 'jobs', jobs);
end $$;

-- Take results back, for places (place_id, out: [{lang, text}]) and events
-- (event_id, out: [{lang, title, place_text, body}]). The rules are the same
-- for both: only for the claim given, only while the text is unchanged, every
-- output through the text rules; an event's empty place or body stays empty.
create or replace function public.translation_apply(p_provider text, p_results jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  item jsonb;
  o jsonb;
  pid bigint;
  eid bigint;
  cid uuid;
  attempts_now smallint;
  p app.places;
  e app.events;
  src_lang text;
  targets text[];
  err text;
  wrote boolean;
  backoff interval;
  stored integer := 0;
  stale integer := 0;
  rejected integer := 0;
  retried integer := 0;
begin
  if p_provider is null or p_provider not in ('azure', 'google', 'deepl') then return app.invalid('provider'); end if;
  if p_results is null or jsonb_typeof(p_results) <> 'array' or jsonb_array_length(p_results) > 100 then
    return app.invalid('results');
  end if;
  for item in select x.value from jsonb_array_elements(p_results) x loop
    if jsonb_typeof(item) <> 'object'
       or coalesce(item->>'claim', '') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
      continue;
    end if;
    cid := (item->>'claim')::uuid;
    pid := null;
    eid := null;
    if coalesce(item->>'place_id', '') ~ '^[0-9]{1,18}$' then
      pid := (item->>'place_id')::bigint;
      select j.attempts into attempts_now from app.translation_jobs j
      where j.place_id = pid and j.claim_id = cid for update;
      if not found then continue; end if;  -- the lease ran out or the text changed since
      select * into p from app.places where id = pid;
      if p.deleted_at is not null
         or pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(p.description, 'UTF8')), 'hex') <> coalesce(item->>'hash', '') then
        stale := stale + 1;
        update app.translation_jobs set claim_id = null, claimed_at = null where place_id = pid;
        continue;
      end if;
      src_lang := p.lang::text;
    elsif coalesce(item->>'event_id', '') ~ '^[0-9]{1,18}$' then
      eid := (item->>'event_id')::bigint;
      select j.attempts into attempts_now from app.event_translation_jobs j
      where j.event_id = eid and j.claim_id = cid for update;
      if not found then continue; end if;
      select * into e from app.events where id = eid;
      if e.deleted_at is not null
         or pg_catalog.encode(app.event_text_hash(e.title, e.place_text, e.body), 'hex') <> coalesce(item->>'hash', '') then
        stale := stale + 1;
        update app.event_translation_jobs set claim_id = null, claimed_at = null where event_id = eid;
        continue;
      end if;
      src_lang := e.lang::text;
    else
      continue;
    end if;
    backoff := least(pg_catalog.power(2, attempts_now) * interval '1 minute', interval '6 hours');

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
      if pid is not null then
        update app.translation_jobs
        set claim_id = null, claimed_at = null, last_error = err, next_attempt_at = now() + backoff
        where place_id = pid;
      else
        update app.event_translation_jobs
        set claim_id = null, claimed_at = null, last_error = err, next_attempt_at = now() + backoff
        where event_id = eid;
      end if;
      retried := retried + 1;
      continue;
    end if;

    targets := array(select l from pg_catalog.unnest(array['en', 'ja', 'ko']) l where l <> src_lang);
    wrote := false;
    if jsonb_typeof(item->'out') = 'array' then
      for o in select x.value from jsonb_array_elements(item->'out') x loop
        if pid is not null
           and jsonb_typeof(o) = 'object' and (o->>'lang') = any (targets)
           and app.check_text(o->>'text', 1, 2000, false) then
          insert into app.place_translations (place_id, lang, description, source_hash, provider)
          values (pid, (o->>'lang')::app.ui_lang, o->>'text',
                  pg_catalog.sha256(pg_catalog.convert_to(p.description, 'UTF8')), p_provider)
          on conflict (place_id, lang) do update
            set description = excluded.description, source_hash = excluded.source_hash,
                provider = excluded.provider, translated_at = now();
          stored := stored + 1;
          wrote := true;
        elsif eid is not null
           and jsonb_typeof(o) = 'object' and (o->>'lang') = any (targets)
           and app.check_text(o->>'title', 1, 200, true)
           and (case when e.place_text = '' then coalesce(o->>'place_text', '') = ''
                     else app.check_text(o->>'place_text', 1, 200, true) end)
           and (case when e.body = '' then coalesce(o->>'body', '') = ''
                     else app.check_text(o->>'body', 1, 2000, false) end) then
          insert into app.event_translations (event_id, lang, title, place_text, body, source_hash, provider)
          values (eid, (o->>'lang')::app.ui_lang, o->>'title', coalesce(o->>'place_text', ''), coalesce(o->>'body', ''),
                  app.event_text_hash(e.title, e.place_text, e.body), p_provider)
          on conflict (event_id, lang) do update
            set title = excluded.title, place_text = excluded.place_text, body = excluded.body,
                source_hash = excluded.source_hash, provider = excluded.provider, translated_at = now();
          stored := stored + 1;
          wrote := true;
        else
          rejected := rejected + 1;
        end if;
      end loop;
    end if;
    if wrote and pid is not null then
      delete from app.translation_jobs where place_id = pid;
    elsif wrote then
      delete from app.event_translation_jobs where event_id = eid;
    elsif pid is not null then
      update app.translation_jobs
      set claim_id = null, claimed_at = null, last_error = 'rejected_output', next_attempt_at = now() + backoff
      where place_id = pid;
      retried := retried + 1;
    else
      update app.event_translation_jobs
      set claim_id = null, claimed_at = null, last_error = 'rejected_output', next_attempt_at = now() + backoff
      where event_id = eid;
      retried := retried + 1;
    end if;
  end loop;
  return jsonb_build_object('status', 'ok', 'stored', stored, 'stale', stale, 'rejected', rejected, 'retried', retried);
end $$;

-- The kick wakes the function for event work too.
create or replace function app.translation_kick() returns void
language plpgsql security definer set search_path = '' as $$
declare
  url text;
  secret text;
  lease interval := pg_catalog.make_interval(secs => app.setting('translation_lease_seconds'));
  max_attempts integer := app.setting('translation_max_attempts');
begin
  if app.setting('translation_enabled') = 0 then return; end if;
  if exists (select 1 from app.translation_state where paused_until > now()) then return; end if;
  if not exists (
    select 1 from app.translation_jobs j
    join app.places p on p.id = j.place_id
    where j.next_attempt_at <= now()
      and (j.claim_id is null or j.claimed_at < now() - lease)
      and j.attempts < max_attempts
      and p.deleted_at is null and p.auto_hidden_at is null and p.suspension_hidden_at is null
  ) and not exists (
    select 1 from app.event_translation_jobs j
    join app.events e on e.id = j.event_id
    where j.next_attempt_at <= now()
      and (j.claim_id is null or j.claimed_at < now() - lease)
      and j.attempts < max_attempts
      and e.deleted_at is null and e.auto_hidden_at is null and e.suspension_hidden_at is null
      and e.last_date >= (now() at time zone 'Asia/Tokyo')::date
  ) then
    return;
  end if;
  select s.decrypted_secret into url from vault.decrypted_secrets s where s.name = 'translate_function_url';
  select s.decrypted_secret into secret from vault.decrypted_secrets s where s.name = 'translate_kick_secret';
  if url is null or secret is null then return; end if;
  perform net.http_post(
    url := url,
    body := '{}'::jsonb,
    headers := jsonb_build_object('x-yunabi-kick', secret, 'content-type', 'application/json'),
    timeout_milliseconds := 30000);
end $$;

-- Cleanup also drops event work that ran out of attempts, or whose event is
-- over (it will never be claimed).
create or replace function app.purge_translation_records() returns void
language sql security definer set search_path = '' as $$
  delete from app.translation_usage where day < (now() at time zone 'UTC')::date - 90;
  delete from app.translation_jobs
  where attempts >= app.setting('translation_max_attempts') and enqueued_at < now() - interval '30 days';
  delete from app.event_translation_jobs j
  where (j.attempts >= app.setting('translation_max_attempts') and j.enqueued_at < now() - interval '30 days')
     or exists (select 1 from app.events e
                where e.id = j.event_id and e.last_date < (now() at time zone 'Asia/Tokyo')::date);
$$;

revoke all on public.event_translations_public from public, anon, authenticated, service_role;
grant select on public.event_translations_public to anon, authenticated;
revoke execute on function app.events_translation_sync(), app.event_text_hash(text, text, text)
  from public, anon, authenticated, service_role;
-- create or replace keeps the grants; restated so this file says who may call what
revoke execute on function public.translation_claim(integer), public.translation_apply(text, jsonb),
  app.translation_kick(), app.purge_translation_records() from public, anon, authenticated, service_role;
grant execute on function public.translation_claim(integer), public.translation_apply(text, jsonb) to service_role;

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

  select string_agg(n.nspname || '.' || p.proname, ', ') into bad
  from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid = p.pronamespace
  where n.nspname in ('public', 'app') and p.prosecdef
    and (not coalesce('search_path=""' = any (p.proconfig), false) or p.prosrc ~* '\mexecute\M');
  if bad is not null then raise exception 'definer functions need search_path and no dynamic SQL: %', bad; end if;

  select string_agg(p.proname, ', ') into bad
  from pg_catalog.pg_proc p
  where p.oid in ('app.translation_kick()'::regprocedure, 'app.purge_translation_records()'::regprocedure,
                  'app.events_translation_sync()'::regprocedure)
    and (pg_catalog.has_function_privilege('anon', p.oid, 'execute')
         or pg_catalog.has_function_privilege('authenticated', p.oid, 'execute')
         or pg_catalog.has_function_privilege('service_role', p.oid, 'execute'));
  if bad is not null then raise exception 'no client EXECUTE: %', bad; end if;

  if (select string_agg(a.attname, ',' order by a.attnum) from pg_catalog.pg_attribute a
      where a.attrelid = 'public.event_translations_public'::regclass and a.attnum > 0 and not a.attisdropped)
     is distinct from 'event_id,lang,title,place_text,body' then
    raise exception 'event_translations_public columns changed';
  end if;
  if pg_catalog.has_table_privilege('service_role', 'public.event_translations_public', 'select') then
    raise exception 'service_role must not read the view';
  end if;
end $$;
