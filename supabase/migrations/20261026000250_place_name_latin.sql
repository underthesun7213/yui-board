-- D31 / Y-M12 (ADR-0026): a place name is written in English, so it holds at
-- least one ASCII Latin letter. Korean-only and Japanese-only names are
-- refused; "Academic Affairs Office (教務課)" passes. The 52 letters are listed
-- rather than written as a range, whose meaning in a Postgres regex depends on
-- the collation. src/domain/validation.ts makes the same check (checked twice).
--
-- create_place and update_place are replaced with the same signatures, so their
-- grants and the checks allowlist stay as they are. update_place checks every
-- name it is given: the CHECK below is validated, so no stored name lacks a
-- letter and an unchanged name always passes.

create function app.has_latin(p text) returns boolean
language sql immutable set search_path = '' as $$
  select p ~ '[ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz]'
$$;
revoke execute on function app.has_latin(text) from public, anon, authenticated, service_role;

-- the last line of defence, with the same expression so it calls no function
alter table app.places add constraint places_name_latin
  check (name ~ '[ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz]') not valid;
alter table app.places validate constraint places_name_latin;

create or replace function public.create_place(
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
  url text := nullif(app.trim_text(p_gmaps_url), '');
  descr text := coalesce(p_description, '');
  nm text := app.trim_text(p_name);
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
  if not (p_lat between -90 and 90 and p_lng between -180 and 180) then return app.invalid('location'); end if;  -- NaN and infinity fail too
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

create or replace function public.update_place(
  p_id bigint, p_name text, p_category app.place_category, p_description text,
  p_gmaps_url text, p_lat double precision, p_lng double precision, p_lang app.ui_lang
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  st text;
  p app.places;
  v_pref char(2);
  url text := nullif(app.trim_text(p_gmaps_url), '');
  descr text := coalesce(p_description, '');
  nm text := app.trim_text(p_name);
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
  if not (p_lat between -90 and 90 and p_lng between -180 and 180) then return app.invalid('location'); end if;  -- NaN and infinity fail too
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

do $$
declare
  f text;
begin
  foreach f in array array[
    'public.create_place(uuid,text,app.place_category,text,text,double precision,double precision,app.ui_lang)',
    'public.update_place(bigint,text,app.place_category,text,text,double precision,double precision,app.ui_lang)']
  loop
    if not pg_catalog.has_function_privilege('authenticated', f, 'execute')
       or pg_catalog.has_function_privilege('anon', f, 'execute') then
      raise exception '% must stay callable by authenticated only', f;
    end if;
    if not (select p.prosecdef and 'search_path=""' = any (p.proconfig) and p.prosrc like '%has_latin%'
            from pg_catalog.pg_proc p where p.oid = f::regprocedure) then
      raise exception '% lost its definer, search_path or name rule', f;
    end if;
  end loop;
  if pg_catalog.has_function_privilege('authenticated', 'app.has_latin(text)', 'execute')
     or pg_catalog.has_function_privilege('anon', 'app.has_latin(text)', 'execute')
     or pg_catalog.has_function_privilege('service_role', 'app.has_latin(text)', 'execute') then
    raise exception 'app.has_latin must not be callable by client roles';
  end if;
  if not (select convalidated from pg_catalog.pg_constraint
          where conrelid = 'app.places'::regclass and conname = 'places_name_latin') then
    raise exception 'places_name_latin is not validated';
  end if;
end $$;
