-- ops_health v2 (RFC-0003 §17.4, runbook §6.1): shape, grants, numbers only, each signal.
-- Counts are compared with a snapshot taken before this file adds its rows.
begin;
\ir _helpers.sql
select plan(26);
update app.settings set int_value = 3 where key = 'ip_writes_per_5min';
update app.settings set int_value = 5 where key = 'ip_writes_per_5min_dorm';
insert into app.ip_tiers (range, tier, note) values
  ('198.51.100.7/32', 'dorm', 'test v4'), ('2001:db8:5:6::/64', 'dorm', 'test v6');
-- today's salt, and the account OH-05 acts as, exist before the snapshot
insert into app.salts (day) values (app.tokyo_today()) on conflict do nothing;
create temp table oh_caller as select tests.user() as id;
grant select on oh_caller to public;
create temp table oh_before as select public.ops_health() as h;
grant select on oh_before to public;
-- a change from the snapshot (created after the table: SQL bodies are checked at creation)
create function tests.oh(p_path text[]) returns bigint language sql as $$
  select (public.ops_health() #>> p_path)::bigint $$;
create function tests.d(p_path text[]) returns bigint language sql as $$
  select tests.oh(p_path) - ((select h from oh_before) #>> p_path)::bigint $$;
grant execute on all functions in schema tests to public;

insert into app.ip_tiers (range, tier, note) values ('10.0.0.0/16', 'dorm', 'too wide');
insert into app.ip_hits (ip_key, window_start, n) values
  (app.ip_key('203.0.113.70'), now(), 3), (app.ip_key('203.0.113.70'), now() - interval '5 minutes', 3),
  (app.ip_key('203.0.113.70'), now() - interval '10 minutes', 3), (app.ip_key('203.0.113.70'), now() - interval '2 hours', 3),
  (app.ip_key('198.51.100.7'), now(), 5), (app.ip_key('198.51.100.7'), now() - interval '5 minutes', 4),
  (app.ip_key('2001:db8:5:6::1'), now(), 5);
insert into app.security_events (kind, at) values ('invalid_input', now()), ('invalid_input', now()),
  ('forbidden', now()), ('not_owner', now()), ('invalid_input', now() - interval '2 hours');
create temp table oh_users as select tests.user() as id union all select tests.user(false, 'oh-user@yunabi.test');
insert into auth.users (id, aud, role, is_anonymous, created_at, updated_at)
  values (gen_random_uuid(), 'authenticated', 'authenticated', true, now() - interval '2 hours', now());
create temp table adm as select tests.user(false, 'oh-admin@yunabi.test') as id;
insert into app.admins (user_id, email) select id, 'oh-admin@yunabi.test' from adm;
insert into app.mod_actions (actor_kind, action, target_kind, target_id, created_at) values
  ('system', 'auto_hide', 'place', 1, now()), ('system', 'auto_hide', 'place', 2, now() - interval '2 hours');
insert into app.mod_actions (actor_kind, actor_admin_id, action, target_kind, target_id)
  select 'admin', id, 'restore', 'place', 1 from adm;
insert into app.mod_actions (actor_kind, actor_admin_id, action, target_kind, account_ref)
  select 'admin', id, 'suspend', 'account', 'a-test' from adm;

select ok(exists (select 1 from pg_proc p where p.oid = 'public.ops_health()'::regprocedure
  and p.prosecdef and p.provolatile = 's' and 'search_path=""' = any (p.proconfig)
  and p.prosrc !~* '\mexecute\M'),
  'OH-01 ops_health is a stable security definer with search_path pinned and no dynamic SQL');
select function_returns('public', 'ops_health', array[]::text[], 'jsonb', 'OH-02 ops_health returns jsonb');
select ok(has_function_privilege('service_role', 'public.ops_health()', 'execute')
  and not has_function_privilege('authenticated', 'public.ops_health()', 'execute')
  and not has_function_privilege('anon', 'public.ops_health()', 'execute')
  and not has_function_privilege('public', 'public.ops_health()', 'execute'),
  'OH-03 only service_role may execute ops_health');
set local role service_role;
select lives_ok('select public.ops_health()', 'OH-04 service_role calls ops_health');
reset role;
select tests.as_user((select id from oh_caller));
select throws_ok('select public.ops_health()', '42501', null, 'OH-05 an account cannot call ops_health');
select tests.as_owner();
select set_eq($$select jsonb_object_keys(public.ops_health())$$,
  array['version', 'at_epoch', 'security_1h', 'security_24h', 'accounts_1h', 'anon_users_1h', 'auto_hides_1h',
        'auto_hides_24h', 'admin_actions_24h', 'admin_actions_by_kind_24h', 'reports_open_over_24h',
        'ip_windows_at_limit_1h', 'ip_1h', 'limits', 'cron', 'db_bytes'], 'OH-06 the top-level keys are exactly these');
select is((select count(*)::int from jsonb_path_query(public.ops_health(), 'strict $.**') v
           where jsonb_typeof(v) not in ('object', 'number', 'null')), 0,
  'OH-07 numbers only: no string, array or boolean anywhere');
select set_eq($$select jsonb_object_keys(public.ops_health() -> 'security_1h')$$,
  $$select m[1] from pg_constraint c, regexp_matches(pg_get_constraintdef(c.oid), '''([a-z_]+)''', 'g') m
    where c.conrelid = 'app.security_events'::regclass and c.contype = 'c' and pg_get_constraintdef(c.oid) like '%kind%'$$,
  'OH-08 security_1h has one key for every kind the table accepts');
select is(tests.d('{security_1h,invalid_input}'), 2::bigint, 'OH-09 invalid_input in the hour');
select is(tests.d('{security_1h,forbidden}'), 1::bigint, 'OH-10 forbidden in the hour');
select is(tests.d('{security_1h,not_owner}'), 1::bigint, 'OH-11 not_owner in the hour');
select is(tests.d('{security_24h,invalid_input}'), 3::bigint, 'OH-12 invalid_input in 24 hours');
select is(tests.d('{anon_users_1h}'), 1::bigint, 'OH-13 anonymous Auth users of the hour only');
select is(tests.d('{auto_hides_1h}'), 1::bigint, 'OH-14 auto hides in the hour');
select is(tests.d('{auto_hides_24h}'), 2::bigint, 'OH-15 auto hides in 24 hours');
select is(tests.d('{admin_actions_by_kind_24h,restore}'), 1::bigint, 'OH-16 admin restores by kind');
select is(tests.d('{admin_actions_by_kind_24h,suspend}'), 1::bigint, 'OH-17 admin suspensions by kind');
select is(tests.d('{ip_1h,default_windows_at_limit}'), 3::bigint, 'OH-18 default-tier windows at the limit, last hour only');
select is(tests.d('{ip_1h,default_keys_3_windows}'), 1::bigint, 'OH-19 one key at the limit in three windows');
select is(tests.d('{ip_1h,dorm_windows_at_limit}'), 2::bigint, 'OH-20 dorm windows (IPv4, IPv6 /64) judged by the dorm limit');
select is(tests.d('{ip_1h,dorm_windows_over_default}'), 3::bigint, 'OH-21 dorm windows over the default limit are not default alerts');
select is(tests.d('{ip_1h,dorm_ranges_not_rebuilt}'), 1::bigint, 'OH-22 a range too wide to rebuild is counted');
select is(tests.d('{ip_windows_at_limit_1h}'), 5::bigint, 'OH-23 the old total is both tiers at their own limit');
select is(tests.oh('{limits,ip_writes_per_5min_dorm}'), 5::bigint, 'OH-24 limits echo the settings');
select is(jsonb_typeof(public.ops_health() -> 'cron'),
  case when to_regclass('cron.job_run_details') is null then 'null' else 'object' end,
  'OH-25 cron is reported where pg_cron exists, null where it does not');
-- last: PostgREST runs a GET in a read-only transaction
set local transaction_read_only = on;
select lives_ok('select public.ops_health()', 'OH-26 ops_health runs in a read-only transaction');
select * from finish();
rollback;
