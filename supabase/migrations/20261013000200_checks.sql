-- Fails the migration if the result of all the above is not what the design
-- says (ERD v2 §8 20). Checks the effect, not the statements.
do $$
declare
  bad text;
  want_auth text[] := array[
    'public.data_version', 'public.my_items', 'public.create_place', 'public.update_place', 'public.delete_place',
    'public.create_event', 'public.update_event', 'public.delete_event', 'public.set_occurrence',
    'public.clear_occurrence', 'public.my_place', 'public.my_event', 'app.db_pre_request'];
  want_anon text[] := array['public.data_version', 'app.db_pre_request'];
  want_service text[] := array['public.ops_health'];
  got text[];
begin
  -- ① every app table has RLS on and no policy
  select string_agg(c.relname, ', ') into bad from pg_class c
  where c.relnamespace = 'app'::regnamespace and c.relkind = 'r'
    and (not c.relrowsecurity or exists (select 1 from pg_policy p where p.polrelid = c.oid));
  if bad is not null then raise exception 'check 1 (RLS on, no policy) failed: %', bad; end if;

  -- ② no client role can touch an app table
  select string_agg(r || ':' || c.relname, ', ') into bad
  from pg_class c, unnest(array['public', 'anon', 'authenticated', 'service_role']) r
  where c.relnamespace = 'app'::regnamespace and c.relkind in ('r', 'v', 'm')
    and has_table_privilege(case when r = 'public' then 'public' else r end, c.oid, 'select,insert,update,delete,truncate,references,trigger');
  if bad is not null then raise exception 'check 2 (no table rights in app) failed: %', bad; end if;

  -- ③ ④ ⑩ who may execute what, in public and app, PUBLIC inheritance included
  select array_agg(n.nspname || '.' || p.proname order by n.nspname || '.' || p.proname) into got
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname in ('public', 'app') and has_function_privilege('anon', p.oid, 'execute');
  if got is distinct from (select array_agg(x order by x) from unnest(want_anon) x) then
    raise exception 'check 3 (anon EXECUTE) failed: %', got; end if;
  select array_agg(n.nspname || '.' || p.proname order by n.nspname || '.' || p.proname) into got
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname in ('public', 'app') and has_function_privilege('authenticated', p.oid, 'execute');
  if got is distinct from (select array_agg(x order by x) from unnest(want_auth) x) then
    raise exception 'check 4 (authenticated EXECUTE) failed: %', got; end if;
  select array_agg(n.nspname || '.' || p.proname order by n.nspname || '.' || p.proname) into got
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname in ('public', 'app') and has_function_privilege('service_role', p.oid, 'execute')
    and not has_function_privilege('anon', p.oid, 'execute');
  if got is distinct from (select array_agg(x order by x) from unnest(want_service) x) then
    raise exception 'check 10 (service_role EXECUTE) failed: %', got; end if;

  -- ⑤ every definer function pins search_path; ⑥ none builds SQL dynamically
  select string_agg(n.nspname || '.' || p.proname, ', ') into bad
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname in ('public', 'app') and p.prosecdef
    and not coalesce('search_path=""' = any (p.proconfig), false);
  if bad is not null then raise exception 'check 5 (search_path) failed: %', bad; end if;
  select string_agg(n.nspname || '.' || p.proname, ', ') into bad
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname in ('public', 'app') and p.prosecdef and p.prosrc ~* '\mexecute\M';
  if bad is not null then raise exception 'check 6 (no dynamic SQL) failed: %', bad; end if;

  -- ⑦ the append-only guard is security invoker
  if (select prosecdef from pg_proc where oid = 'app.mod_actions_guard'::regproc) then
    raise exception 'check 7 (guard is invoker) failed'; end if;

  -- ⑧ public view columns are exactly these
  select string_agg(v, '; ') into bad from (
    select format('%s: %s', t.view, t.cols) as v from (values
      ('places_public', 'id,name,category,description,gmaps_url,lat,lng,pref,lang,created_on,edited_on'),
      ('events_public', 'id,title,start_date,start_time,end_time,weekly_until,place_text,body,lang,created_on,edited_on'),
      ('event_occurrences_public', 'event_id,occurs_on,cancelled,title,start_time,end_time,place_text,body'),
      ('prefecture_counts', 'pref,n')) t(view, cols)
    where t.cols is distinct from (
      select string_agg(a.attname, ',' order by a.attnum) from pg_attribute a
      where a.attrelid = ('public.' || t.view)::regclass and a.attnum > 0 and not a.attisdropped)
  ) x;
  if bad is not null then raise exception 'check 8 (view columns) failed: %', bad; end if;

  -- ⑨ no default EXECUTE for the client roles or PUBLIC in our schemas
  select string_agg(d.defaclrole::regrole::text, ', ') into bad
  from pg_default_acl d, aclexplode(d.defaclacl) a
  where d.defaclobjtype = 'f'
    and (d.defaclnamespace = 0 or d.defaclnamespace in ('public'::regnamespace, 'app'::regnamespace))
    and a.privilege_type = 'EXECUTE'
    and (a.grantee = 0 or a.grantee in ('anon'::regrole, 'authenticated'::regrole))
    and (d.defaclnamespace <> 0 or d.defaclrole = 'postgres'::regrole);
  if bad is not null then raise exception 'check 9 (default EXECUTE) failed: %', bad; end if;
  -- … and the global default for postgres exists and leaves PUBLIC out
  if not exists (
    select 1 from pg_default_acl d
    where d.defaclrole = 'postgres'::regrole and d.defaclnamespace = 0 and d.defaclobjtype = 'f'
      and not exists (select 1 from aclexplode(d.defaclacl) a where a.grantee = 0 and a.privilege_type = 'EXECUTE')
  ) then raise exception 'check 9b (global default: no PUBLIC EXECUTE) failed'; end if;

  -- ⑫ no extension in public
  select string_agg(extname, ', ') into bad from pg_extension where extnamespace = 'public'::regnamespace;
  if bad is not null then raise exception 'check 12 (extensions outside public) failed: %', bad; end if;

  -- ⑬ only postgres may bind an admin
  if has_function_privilege('anon', 'app.bind_admin(uuid, text)', 'execute')
     or has_function_privilege('authenticated', 'app.bind_admin(uuid, text)', 'execute')
     or has_function_privilege('service_role', 'app.bind_admin(uuid, text)', 'execute') then
    raise exception 'check 13 (bind_admin) failed'; end if;
end $$;
