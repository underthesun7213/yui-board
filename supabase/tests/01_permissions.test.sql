-- G-01, G-02, G-03, G-12, G-20: who can reach what.
begin;
\ir _helpers.sql
select plan(17);

-- G-01: no client role reads or writes any app table
select tests.as_anon();
select throws_ok('select * from app.places', '42501', null, 'anon cannot read app.places');
select throws_ok('select * from app.settings', '42501', null, 'anon cannot read app.settings');
select tests.as_owner();
select tests.as_user(tests.user());
select throws_ok('select * from app.places', '42501', null, 'authenticated cannot read app.places');
select throws_ok($$insert into app.places (name) values ('x')$$, '42501', null, 'authenticated cannot insert app.places');
select throws_ok('delete from app.place_owners', '42501', null, 'authenticated cannot delete ownership');
select throws_ok('update app.accounts set suspended_at = null', '42501', null, 'authenticated cannot unsuspend itself');

-- G-02: public views are read-only
select throws_ok($$insert into public.places_public (name) values ('x')$$, '42501', null, 'views cannot be written');
select lives_ok('select * from public.places_public', 'authenticated reads the public view');
select tests.as_owner();
select tests.as_anon();
select lives_ok('select * from public.events_public', 'anon reads the public view');

-- G-12: anon cannot call writes
select throws_ok($$select public.create_place(gen_random_uuid(), 'x', 'food', '', null, 34.82, 135.65, 'en')$$,
  '42501', null, 'anon cannot create a place');
select throws_ok('select public.ops_health()', '42501', null, 'anon cannot call ops_health');
select tests.as_owner();

-- G-03: the EXECUTE allowlist, PUBLIC inheritance included
select set_eq(
  $$select n.nspname || '.' || p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname in ('public', 'app') and has_function_privilege('anon', p.oid, 'execute')$$,
  array['public.data_version', 'app.db_pre_request'], 'anon may execute exactly these');
select set_eq(
  $$select n.nspname || '.' || p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname in ('public', 'app') and has_function_privilege('authenticated', p.oid, 'execute')$$,
  array['public.data_version', 'public.my_items', 'public.create_place', 'public.update_place',
        'public.delete_place', 'public.create_event', 'public.update_event', 'public.delete_event',
        'public.set_occurrence', 'public.clear_occurrence', 'public.my_place', 'public.my_event',
        'app.db_pre_request', 'public.submit_report', 'public.admin_whoami', 'public.admin_queue',
        'public.admin_item', 'public.admin_restore', 'public.admin_restore_bulk', 'public.admin_delete',
        'public.admin_dismiss', 'public.admin_suspend', 'public.admin_unsuspend', 'public.admin_search',
        'public.admin_audit_log'],
  'authenticated may execute exactly these');
select is_empty(
  $$select p.proname from pg_proc p where p.pronamespace in ('public'::regnamespace, 'app'::regnamespace)
    and has_function_privilege('public', p.oid, 'execute') and p.proname <> 'db_pre_request'
    and p.proname <> 'data_version'$$,
  'PUBLIC executes nothing beyond the two open functions');

-- G-20: view columns carry no owner, token or moderation field
select columns_are('public', 'places_public',
  array['id', 'name', 'category', 'description', 'gmaps_url', 'lat', 'lng', 'pref', 'lang', 'created_on', 'edited_on'],
  'places_public columns');

-- M1: a function created later is not executable by PUBLIC (global default)
create function public.later_added() returns integer language sql as $$ select 1 $$;
create function app.later_added() returns integer language sql as $$ select 1 $$;
select ok(not has_function_privilege('anon', 'public.later_added()', 'execute'), 'a new public function is closed by default');
select ok(not has_function_privilege('authenticated', 'app.later_added()', 'execute'), 'a new app function is closed by default');

select * from finish();
rollback;
