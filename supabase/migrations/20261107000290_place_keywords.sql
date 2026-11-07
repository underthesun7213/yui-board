-- Place keywords (owner, 2026-11-07): up to three per place, chosen from a
-- fixed list that the app translates (src/domain/keywords.ts holds the same
-- list; src/domain/validation.ts the same rule). Card OK and Cash only
-- exclude each other.
--
-- Zero-downtime (ADR-0028): everything here adds. create_place and
-- update_place stay as they are for the app already open in people's
-- browsers; an edit through the old update_place leaves the keywords alone.
-- The new app writes through create_place_v2 and update_place_v2. The public
-- view and my_place gain a field at the end. The admin console tags places
-- with admin_set_keywords, logged as the action 'keywords'.

alter table app.places add column keywords text[] not null default '{}'
  constraint places_keywords check (
    keywords <@ array['cheap', 'late', 'english', 'card', 'cash_only', 'solo', 'groups', 'vegetarian',
                      'halal', 'study', 'takeout', 'photo', 'free', 'bike']::text[]
    and pg_catalog.cardinality(keywords) <= 3);

-- The list a function was given, in the list's own order without repeats,
-- '{}' for null, or null when it is not allowed.
create function app.clean_keywords(p text[]) returns text[]
language plpgsql immutable set search_path = '' as $$
declare
  k constant text[] := array['cheap', 'late', 'english', 'card', 'cash_only', 'solo', 'groups', 'vegetarian',
                             'halal', 'study', 'takeout', 'photo', 'free', 'bike'];
  r text[];
begin
  if p is null then return '{}'; end if;
  -- an empty or unknown element fails here, and so does a null one
  if not (p <@ k) then return null; end if;
  select coalesce(pg_catalog.array_agg(u.x order by u.i), '{}') into r
  from pg_catalog.unnest(k) with ordinality u(x, i) where u.x = any (p);
  if pg_catalog.cardinality(r) > 3 or ('card' = any (r) and 'cash_only' = any (r)) then return null; end if;
  return r;
end $$;

alter table app.mod_actions drop constraint mod_actions_action_check;
alter table app.mod_actions add constraint mod_actions_action_check
  check (action in ('auto_hide', 'restore', 'delete', 'dismiss', 'suspend', 'unsuspend', 'keywords'));

create or replace view public.places_public with (security_invoker = false) as
select p.id, p.name, p.category::text as category, p.description, p.gmaps_url, p.lat, p.lng, p.pref,
       p.lang::text as lang,
       (p.created_at at time zone 'Asia/Tokyo')::date as created_on,
       (p.edited_at at time zone 'Asia/Tokyo')::date as edited_on,
       p.keywords
from app.places p
where p.deleted_at is null and p.auto_hidden_at is null and p.suspension_hidden_at is null;

create or replace function public.my_place(p_id bigint) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('id', p.id, 'name', p.name, 'category', p.category, 'description', p.description,
                            'gmaps_url', p.gmaps_url, 'lat', p.lat, 'lng', p.lng, 'pref', p.pref, 'lang', p.lang,
                            'keywords', p.keywords)
  from app.places p join app.place_owners o on o.place_id = p.id
  where p.id = p_id and o.owner_id = auth.uid() and p.deleted_at is null
$$;

-- create_place (20261026000250) with keywords
create function public.create_place_v2(
  p_client_token uuid, p_name text, p_category app.place_category, p_description text,
  p_gmaps_url text, p_lat double precision, p_lng double precision, p_lang app.ui_lang, p_keywords text[]
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  st text;
  uid uuid;
  found_id bigint;
  v_pref char(2);
  new_id bigint;
  url text := nullif(app.trim_text(p_gmaps_url), '');
  descr text := coalesce(p_description, '');
  nm text := app.trim_text(p_name);
  kw text[] := app.clean_keywords(p_keywords);
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
  if not app.has_latin(nm) then return app.invalid('name_latin'); end if;  -- D31: written in English
  if p_category is null then return app.invalid('category'); end if;
  if not app.check_text(descr, 0, 500, false) then return app.invalid('description'); end if;
  if not app.check_maps_url(url) then return app.invalid('gmaps_url'); end if;
  if p_lang is null then return app.invalid('lang'); end if;
  if kw is null then return app.invalid('keywords'); end if;
  if not (p_lat between -90 and 90 and p_lng between -180 and 180) then return app.invalid('location'); end if;  -- NaN and infinity fail too
  v_pref := app.pref_of(p_lat, p_lng);
  if v_pref is null then return app.invalid('location'); end if;
  if not app.take_quota('place_create', 'place_create_per_day') then
    return jsonb_build_object('status', 'rate_limited');
  end if;
  insert into app.places (name, category, description, gmaps_url, lat, lng, pref, lang, keywords)
  values (nm, p_category, descr, url, p_lat, p_lng, v_pref, p_lang, kw)
  returning id into new_id;
  insert into app.place_owners (place_id, owner_id, client_token) values (new_id, uid, p_client_token);
  return jsonb_build_object('status', 'ok', 'id', new_id, 'pref', v_pref);
end $$;

-- update_place (20261026000250) with keywords
create function public.update_place_v2(
  p_id bigint, p_name text, p_category app.place_category, p_description text,
  p_gmaps_url text, p_lat double precision, p_lng double precision, p_lang app.ui_lang, p_keywords text[]
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  st text;
  p app.places;
  v_pref char(2);
  url text := nullif(app.trim_text(p_gmaps_url), '');
  descr text := coalesce(p_description, '');
  nm text := app.trim_text(p_name);
  kw text[] := app.clean_keywords(p_keywords);
begin
  st := app.require_writer();
  if st <> 'ok' then return jsonb_build_object('status', st); end if;
  p := app.own_place(p_id);
  if p.id is null then return jsonb_build_object('status', 'not_found'); end if;
  if not app.check_text(nm, 1, 60, true) then return app.invalid('name'); end if;
  if not app.has_latin(nm) then return app.invalid('name_latin'); end if;  -- D31: written in English
  if p_category is null then return app.invalid('category'); end if;
  if not app.check_text(descr, 0, 500, false) then return app.invalid('description'); end if;
  if not app.check_maps_url(url) then return app.invalid('gmaps_url'); end if;
  if p_lang is null then return app.invalid('lang'); end if;
  if kw is null then return app.invalid('keywords'); end if;
  if not (p_lat between -90 and 90 and p_lng between -180 and 180) then return app.invalid('location'); end if;  -- NaN and infinity fail too
  v_pref := app.pref_of(p_lat, p_lng);
  if v_pref is null then return app.invalid('location'); end if;
  if not app.take_quota('edit', 'edit_per_day') then return jsonb_build_object('status', 'rate_limited'); end if;
  -- editing ends an admin's protection; hidden stays hidden (Y-E1, Y-R6)
  update app.places
  set name = nm, category = p_category, description = descr, gmaps_url = url,
      lat = p_lat, lng = p_lng, pref = v_pref, lang = p_lang, keywords = kw,
      edited_at = now(), restored_at = null
  where id = p_id;
  perform app.evaluate_item('place', p_id);
  return jsonb_build_object('status', 'ok', 'pref', v_pref);
end $$;

-- The owner tags places in the console. Not an edit: the date and an admin's
-- protection stay as they are.
create function public.admin_set_keywords(p_id bigint, p_keywords text[], p_note text default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  a app.admins;
  kw text[];
  n integer;
begin
  perform app.require_admin();
  a := app.require_admin();
  kw := app.clean_keywords(p_keywords);
  if kw is null then return app.invalid('keywords'); end if;
  update app.places set keywords = kw where id = p_id and deleted_at is null;
  get diagnostics n = row_count;
  if n = 0 then return jsonb_build_object('status', 'not_found'); end if;
  perform app.log_admin(a, 'keywords', 'place', p_id, null, jsonb_build_object('keywords', kw), p_note);
  return jsonb_build_object('status', 'ok', 'keywords', kw);
end $$;

revoke execute on function app.clean_keywords(text[]),
  public.create_place_v2(uuid, text, app.place_category, text, text, double precision, double precision, app.ui_lang, text[]),
  public.update_place_v2(bigint, text, app.place_category, text, text, double precision, double precision, app.ui_lang, text[]),
  public.admin_set_keywords(bigint, text[], text)
  from public, anon, authenticated, service_role;
grant execute on function
  public.create_place_v2(uuid, text, app.place_category, text, text, double precision, double precision, app.ui_lang, text[]),
  public.update_place_v2(bigint, text, app.place_category, text, text, double precision, double precision, app.ui_lang, text[]),
  public.admin_set_keywords(bigint, text[], text)
  to authenticated;

-- The checks migration runs before this one on a new database and never again
-- on the hosted one, so this migration checks what it changed.
do $$
declare
  bad text;
  got text[];
begin
  select array_agg(n.nspname || '.' || p.proname order by n.nspname || '.' || p.proname) into got
  from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid = p.pronamespace
  where n.nspname in ('public', 'app') and pg_catalog.has_function_privilege('anon', p.oid, 'execute');
  if got is distinct from array['app.db_pre_request', 'public.data_version'] then
    raise exception 'anon EXECUTE: %', got;
  end if;
  select array_agg(n.nspname || '.' || p.proname order by n.nspname || '.' || p.proname) into got
  from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid = p.pronamespace
  where n.nspname in ('public', 'app') and pg_catalog.has_function_privilege('authenticated', p.oid, 'execute');
  if got is distinct from (select array_agg(x order by x) from unnest(array[
      'public.data_version', 'public.my_items', 'public.create_place', 'public.update_place', 'public.delete_place',
      'public.create_event', 'public.update_event', 'public.delete_event', 'public.set_occurrence',
      'public.clear_occurrence', 'public.my_place', 'public.my_event', 'app.db_pre_request',
      'public.submit_report', 'public.admin_whoami', 'public.admin_queue', 'public.admin_item',
      'public.admin_restore', 'public.admin_restore_bulk', 'public.admin_delete', 'public.admin_dismiss',
      'public.admin_suspend', 'public.admin_unsuspend', 'public.admin_search', 'public.admin_audit_log',
      'public.create_place_v2', 'public.update_place_v2', 'public.admin_set_keywords']) x) then
    raise exception 'authenticated EXECUTE: %', got;
  end if;
  if pg_catalog.has_function_privilege('service_role', 'app.clean_keywords(text[])', 'execute') then
    raise exception 'app.clean_keywords must not be callable by client roles';
  end if;

  select string_agg(n.nspname || '.' || p.proname, ', ') into bad
  from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid = p.pronamespace
  where n.nspname in ('public', 'app') and p.prosecdef
    and (not coalesce('search_path=""' = any (p.proconfig), false) or p.prosrc ~* '\mexecute\M');
  if bad is not null then raise exception 'definer functions need search_path and no dynamic SQL: %', bad; end if;

  -- the same rule as check 11: the caller is checked before anything else
  if (select substring(p.prosrc from '\mbegin\M\s+([^;]*;)') is distinct from 'perform app.require_admin();'
             or substring(p.prosrc from '^(.*?)\mbegin\M') ~* '(:=|=|\mdefault\M)[^;]*\('
      from pg_catalog.pg_proc p where p.oid = 'public.admin_set_keywords(bigint, text[], text)'::regprocedure) then
    raise exception 'admin_set_keywords must check the caller first';
  end if;

  if (select string_agg(a.attname, ',' order by a.attnum) from pg_catalog.pg_attribute a
      where a.attrelid = 'public.places_public'::regclass and a.attnum > 0 and not a.attisdropped)
     is distinct from 'id,name,category,description,gmaps_url,lat,lng,pref,lang,created_on,edited_on,keywords' then
    raise exception 'places_public columns changed';
  end if;
  if pg_catalog.has_table_privilege('service_role', 'public.places_public', 'select')
     or not pg_catalog.has_table_privilege('anon', 'public.places_public', 'select') then
    raise exception 'places_public grants changed';
  end if;
end $$;
