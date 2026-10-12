-- Writes (Y-M6~M8, Y-K4~K9, Y-E1~E3, Y-A1~A5). Every check runs here, so a
-- request that skips the app meets the same rules. Results are
-- {status: ok | duplicate | invalid | not_found | past_event | rate_limited
--  | suspended | forbidden, ...}; malformed input is a status, not an error.

-- ---------- shared validation ----------

create function app.check_text(p_value text, p_min integer, p_max integer, p_single_line boolean)
returns boolean
language sql immutable set search_path = '' as $$
  select p_value is not null
     and char_length(p_value) between p_min and p_max
     and (not p_single_line or p_value !~ '[[:cntrl:]]')
     and (p_single_line or p_value !~ '[\x01-\x08\x0b\x0c\x0e-\x1f\x7f]')
$$;

create function app.check_maps_url(p_url text) returns boolean
language sql immutable set search_path = '' as $$
  select p_url is null
      or (char_length(p_url) <= 500
          and p_url ~ '^https://((www\.)?google\.(com|co\.jp)/maps([/?#]|$)|maps\.app\.goo\.gl/)')
$$;

-- Ends of an occurrence in Japan time.
create function app.ends_at(p_day date, p_end time) returns timestamptz
language sql immutable set search_path = '' as $$
  select (p_day + p_end) at time zone 'Asia/Tokyo'
$$;

-- ---------- places ----------

create function public.create_place(
  p_client_token uuid, p_name text, p_category app.place_category, p_description text,
  p_gmaps_url text, p_lat double precision, p_lng double precision, p_lang app.ui_lang
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  st text;
  uid uuid;
  found_id bigint;
  v_pref char(2);
  new_id bigint;
  url text := nullif(btrim(coalesce(p_gmaps_url, '')), '');
  descr text := coalesce(p_description, '');
  nm text := btrim(coalesce(p_name, ''));
begin
  st := app.require_writer();
  if st <> 'ok' then return jsonb_build_object('status', st); end if;
  uid := auth.uid();
  if p_client_token is null then return app.invalid('client_token'); end if;
  -- the same form sent twice (Y-C4)
  select o.place_id into found_id from app.place_owners o where o.owner_id = uid and o.client_token = p_client_token;
  if found_id is not null then
    return jsonb_build_object('status', 'duplicate', 'id', found_id,
                              'pref', (select p.pref from app.places p where p.id = found_id));
  end if;
  if not app.check_text(nm, 1, 60, true) then return app.invalid('name'); end if;
  if p_category is null then return app.invalid('category'); end if;
  if not app.check_text(descr, 0, 500, false) then return app.invalid('description'); end if;
  if not app.check_maps_url(url) then return app.invalid('gmaps_url'); end if;
  if p_lang is null then return app.invalid('lang'); end if;
  if p_lat is null or p_lng is null or p_lat <> p_lat or p_lng <> p_lng then return app.invalid('location'); end if;
  v_pref := app.pref_of(p_lat, p_lng);
  if v_pref is null then return app.invalid('location'); end if;
  if not app.take_quota('place_create', 'place_create_per_day') then
    return jsonb_build_object('status', 'rate_limited');
  end if;
  insert into app.places (name, category, description, gmaps_url, lat, lng, pref, lang)
  values (nm, p_category, descr, url, p_lat, p_lng, v_pref, p_lang)
  returning id into new_id;
  insert into app.place_owners (place_id, owner_id, client_token) values (new_id, uid, p_client_token);
  return jsonb_build_object('status', 'ok', 'id', new_id, 'pref', v_pref);
end $$;

-- The caller's own, not deleted place, or null (and a security event when the
-- place exists but belongs to someone else).
create function app.own_place(p_id bigint) returns app.places
language plpgsql security definer set search_path = '' as $$
declare
  p app.places;
begin
  select pl.* into p from app.places pl
  join app.place_owners o on o.place_id = pl.id
  where pl.id = p_id and o.owner_id = auth.uid() and pl.deleted_at is null
  for update of pl;
  if not found then
    if exists (select 1 from app.places where id = p_id and deleted_at is null) then
      perform app.log_security('not_owner', 'place ' || p_id);
    end if;
    return null;
  end if;
  return p;
end $$;

create function public.update_place(
  p_id bigint, p_name text, p_category app.place_category, p_description text,
  p_gmaps_url text, p_lat double precision, p_lng double precision, p_lang app.ui_lang
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  st text;
  p app.places;
  v_pref char(2);
  url text := nullif(btrim(coalesce(p_gmaps_url, '')), '');
  descr text := coalesce(p_description, '');
  nm text := btrim(coalesce(p_name, ''));
begin
  st := app.require_writer();
  if st <> 'ok' then return jsonb_build_object('status', st); end if;
  p := app.own_place(p_id);
  if p.id is null then return jsonb_build_object('status', 'not_found'); end if;
  if not app.check_text(nm, 1, 60, true) then return app.invalid('name'); end if;
  if p_category is null then return app.invalid('category'); end if;
  if not app.check_text(descr, 0, 500, false) then return app.invalid('description'); end if;
  if not app.check_maps_url(url) then return app.invalid('gmaps_url'); end if;
  if p_lang is null then return app.invalid('lang'); end if;
  if p_lat is null or p_lng is null or p_lat <> p_lat or p_lng <> p_lng then return app.invalid('location'); end if;
  v_pref := app.pref_of(p_lat, p_lng);
  if v_pref is null then return app.invalid('location'); end if;
  if not app.take_quota('edit', 'edit_per_day') then return jsonb_build_object('status', 'rate_limited'); end if;
  -- editing ends an admin's protection; hidden stays hidden (Y-E1, Y-R6)
  update app.places
  set name = nm, category = p_category, description = descr, gmaps_url = url,
      lat = p_lat, lng = p_lng, pref = v_pref, lang = p_lang, edited_at = now(), restored_at = null
  where id = p_id;
  perform app.evaluate_item('place', p_id);
  return jsonb_build_object('status', 'ok', 'pref', v_pref);
end $$;

-- Owners may delete even a hidden place (Y-E3), and even while suspended
-- (OQ-E2: removing one's own data). Kept 30 days, then purged (Y-E2).
create function public.delete_place(p_id bigint) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  st text;
  p app.places;
begin
  st := app.require_writer(true);
  if st <> 'ok' then return jsonb_build_object('status', st); end if;
  p := app.own_place(p_id);
  if p.id is null then return jsonb_build_object('status', 'not_found'); end if;
  update app.places set deleted_at = now(), deleted_by = 'owner' where id = p_id;
  return jsonb_build_object('status', 'ok');
end $$;

-- ---------- events ----------

create function app.check_event(
  p_title text, p_start_date date, p_start_time time, p_end_time time, p_weekly_until date,
  p_place_text text, p_body text, p_lang app.ui_lang
) returns text
language sql stable set search_path = '' as $$
  select case
    when not app.check_text(p_title, 1, 60, true) then 'title'
    when p_start_date is null then 'start_date'
    when p_start_time is null or p_end_time is null or p_end_time <= p_start_time then 'time'
    when p_weekly_until is not null and not (p_weekly_until > p_start_date
         and p_weekly_until <= p_start_date + 175 and (p_weekly_until - p_start_date) % 7 = 0) then 'weekly_until'
    when not app.check_text(p_place_text, 0, 60, true) then 'place_text'
    when not app.check_text(p_body, 0, 500, false) then 'body'
    when p_lang is null then 'lang'
  end
$$;

create function public.create_event(
  p_client_token uuid, p_title text, p_start_date date, p_start_time time, p_end_time time,
  p_weekly_until date, p_place_text text, p_body text, p_lang app.ui_lang
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  st text;
  uid uuid;
  found_id bigint;
  bad text;
  new_id bigint;
  tt text := btrim(coalesce(p_title, ''));
  pt text := btrim(coalesce(p_place_text, ''));
  bd text := coalesce(p_body, '');
begin
  st := app.require_writer();
  if st <> 'ok' then return jsonb_build_object('status', st); end if;
  uid := auth.uid();
  if p_client_token is null then return app.invalid('client_token'); end if;
  select o.event_id into found_id from app.event_owners o where o.owner_id = uid and o.client_token = p_client_token;
  if found_id is not null then return jsonb_build_object('status', 'duplicate', 'id', found_id); end if;
  bad := app.check_event(tt, p_start_date, p_start_time, p_end_time, p_weekly_until, pt, bd, p_lang);
  if bad is not null then return app.invalid(bad); end if;
  if p_start_date < app.tokyo_today() then return app.invalid('start_date'); end if;
  if not app.take_quota('event_create', 'event_create_per_day') then
    return jsonb_build_object('status', 'rate_limited');
  end if;
  insert into app.events (title, start_date, start_time, end_time, weekly_until, place_text, body, lang)
  values (tt, p_start_date, p_start_time, p_end_time, p_weekly_until, pt, bd, p_lang)
  returning id into new_id;
  insert into app.event_owners (event_id, owner_id, client_token) values (new_id, uid, p_client_token);
  return jsonb_build_object('status', 'ok', 'id', new_id);
end $$;

create function app.own_event(p_id bigint) returns app.events
language plpgsql security definer set search_path = '' as $$
declare
  e app.events;
begin
  select ev.* into e from app.events ev
  join app.event_owners o on o.event_id = ev.id
  where ev.id = p_id and o.owner_id = auth.uid() and ev.deleted_at is null
  for update of ev;
  if not found then
    if exists (select 1 from app.events where id = p_id and deleted_at is null) then
      perform app.log_security('not_owner', 'event ' || p_id);
    end if;
    return null;
  end if;
  return e;
end $$;

create function public.update_event(
  p_id bigint, p_title text, p_start_date date, p_start_time time, p_end_time time,
  p_weekly_until date, p_place_text text, p_body text, p_lang app.ui_lang
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  st text;
  e app.events;
  bad text;
  today date := app.tokyo_today();
  tt text := btrim(coalesce(p_title, ''));
  pt text := btrim(coalesce(p_place_text, ''));
  bd text := coalesce(p_body, '');
begin
  st := app.require_writer();
  if st <> 'ok' then return jsonb_build_object('status', st); end if;
  e := app.own_event(p_id);
  if e.id is null then return jsonb_build_object('status', 'not_found'); end if;
  -- an event that is over stays as it was (Y-K9)
  if app.ends_at(e.last_date, e.end_time) < now() then return jsonb_build_object('status', 'past_event'); end if;
  bad := app.check_event(tt, p_start_date, p_start_time, p_end_time, p_weekly_until, pt, bd, p_lang);
  if bad is not null then return app.invalid(bad); end if;
  -- once a series has started its start date is fixed; before that it may move, but not into the past
  if e.start_date < today and p_start_date <> e.start_date then return app.invalid('start_date'); end if;
  if e.start_date >= today and p_start_date < today then return app.invalid('start_date'); end if;
  if not app.take_quota('edit', 'edit_per_day') then return jsonb_build_object('status', 'rate_limited'); end if;
  update app.events
  set title = tt, start_date = p_start_date, start_time = p_start_time, end_time = p_end_time,
      weekly_until = p_weekly_until, place_text = pt, body = bd, lang = p_lang,
      edited_at = now(), restored_at = null
  where id = p_id;
  -- one-week changes that no longer fall on a date of the series go
  delete from app.event_occurrences o
  where o.event_id = p_id
    and (p_weekly_until is null or o.occurs_on < p_start_date or o.occurs_on > p_weekly_until
         or (o.occurs_on - p_start_date) % 7 <> 0);
  perform app.evaluate_item('event', p_id);
  return jsonb_build_object('status', 'ok');
end $$;

create function public.delete_event(p_id bigint) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  st text;
  e app.events;
begin
  st := app.require_writer(true);
  if st <> 'ok' then return jsonb_build_object('status', st); end if;
  e := app.own_event(p_id);
  if e.id is null then return jsonb_build_object('status', 'not_found'); end if;
  update app.events set deleted_at = now(), deleted_by = 'owner' where id = p_id;
  return jsonb_build_object('status', 'ok');
end $$;

-- ---------- one week of a weekly event (Y-K7) ----------

create function app.check_occurrence(e app.events, p_day date) returns text
language sql stable set search_path = '' as $$
  select case
    when p_day is null or e.weekly_until is null or p_day < e.start_date or p_day > e.weekly_until
         or (p_day - e.start_date) % 7 <> 0 then 'occurs_on'
  end
$$;

create function public.set_occurrence(
  p_event_id bigint, p_occurs_on date, p_cancelled boolean, p_title text,
  p_start_time time, p_end_time time, p_place_text text, p_body text
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  st text;
  e app.events;
  bad text;
  tt text := nullif(btrim(coalesce(p_title, '')), '');
  pt text := nullif(btrim(coalesce(p_place_text, '')), '');
  bd text := nullif(p_body, '');
begin
  st := app.require_writer();
  if st <> 'ok' then return jsonb_build_object('status', st); end if;
  e := app.own_event(p_event_id);
  if e.id is null then return jsonb_build_object('status', 'not_found'); end if;
  bad := app.check_occurrence(e, p_occurs_on);
  if bad is not null then return app.invalid(bad); end if;
  if app.ends_at(p_occurs_on, coalesce(p_end_time, e.end_time)) < now() then
    return jsonb_build_object('status', 'past_event');
  end if;
  if p_cancelled is null then return app.invalid('cancelled'); end if;
  if tt is not null and not app.check_text(tt, 1, 60, true) then return app.invalid('title'); end if;
  if coalesce(p_end_time, e.end_time) <= coalesce(p_start_time, e.start_time) then return app.invalid('time'); end if;
  if pt is not null and not app.check_text(pt, 0, 60, true) then return app.invalid('place_text'); end if;
  if bd is not null and not app.check_text(bd, 0, 500, false) then return app.invalid('body'); end if;
  if not app.take_quota('edit', 'edit_per_day') then return jsonb_build_object('status', 'rate_limited'); end if;
  insert into app.event_occurrences as o (event_id, occurs_on, cancelled, title, start_time, end_time, place_text, body)
  values (p_event_id, p_occurs_on, p_cancelled, tt, p_start_time, p_end_time, pt, bd)
  on conflict (event_id, occurs_on) do update
  set cancelled = excluded.cancelled, title = excluded.title, start_time = excluded.start_time,
      end_time = excluded.end_time, place_text = excluded.place_text, body = excluded.body, edited_at = now();
  return jsonb_build_object('status', 'ok');
end $$;

create function public.clear_occurrence(p_event_id bigint, p_occurs_on date) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  st text;
  e app.events;
  bad text;
begin
  st := app.require_writer();
  if st <> 'ok' then return jsonb_build_object('status', st); end if;
  e := app.own_event(p_event_id);
  if e.id is null then return jsonb_build_object('status', 'not_found'); end if;
  bad := app.check_occurrence(e, p_occurs_on);
  if bad is not null then return app.invalid(bad); end if;
  if app.ends_at(p_occurs_on, e.end_time) < now() then return jsonb_build_object('status', 'past_event'); end if;
  if not app.take_quota('edit', 'edit_per_day') then return jsonb_build_object('status', 'rate_limited'); end if;
  delete from app.event_occurrences where event_id = p_event_id and occurs_on = p_occurs_on;
  return jsonb_build_object('status', 'ok');
end $$;

-- ---------- my items (ME-02, Y-R8) ----------
-- Read-only and called with GET; never creates an account.
create function public.my_items()
returns table (kind text, id bigint, title text, state text, created_on date, edited_on date,
               deleted_on date, last_date date)
language sql stable security definer set search_path = '' as $$
  select 'place', p.id, p.name,
         case when p.deleted_at is not null then 'deleted'
              when p.auto_hidden_at is not null or p.suspension_hidden_at is not null then 'hidden_review'
              else 'visible' end,
         (p.created_at at time zone 'Asia/Tokyo')::date, (p.edited_at at time zone 'Asia/Tokyo')::date,
         (p.deleted_at at time zone 'Asia/Tokyo')::date, null::date
  from app.places p join app.place_owners o on o.place_id = p.id
  where o.owner_id = auth.uid()
  union all
  select 'event', e.id, e.title,
         case when e.deleted_at is not null then 'deleted'
              when e.auto_hidden_at is not null or e.suspension_hidden_at is not null then 'hidden_review'
              else 'visible' end,
         (e.created_at at time zone 'Asia/Tokyo')::date, (e.edited_at at time zone 'Asia/Tokyo')::date,
         (e.deleted_at at time zone 'Asia/Tokyo')::date, e.last_date
  from app.events e join app.event_owners o on o.event_id = e.id
  where o.owner_id = auth.uid()
  order by 5 desc, 2 desc
$$;
