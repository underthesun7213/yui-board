-- D32 / ADR-0026: waking the translate function and cleaning up after it
-- (ERD v2 §6). The local stack has no Vault or pg_net, so the kick is only
-- run on paths that return before reaching them.
begin;
\ir _helpers.sql
select plan(8);

create temp table ids (k text primary key, v uuid);
insert into ids values ('a', tests.user());
grant select on ids to public;
create temp table r (k text primary key, v jsonb);
grant all on r to public;
create function tests.id(text) returns uuid language sql as $$ select v from ids where k = $1 $$;
create function tests.pid(text) returns bigint language sql as $$ select (v->>'id')::bigint from r where k = $1 $$;
grant execute on all functions in schema tests to public;

select tests.as_user(tests.id('a'));
insert into r select 'p1', public.create_place(gen_random_uuid(), 'Kick One', 'food', 'one', null, 34.82, 135.65, 'en');
insert into r select 'p2', public.create_place(gen_random_uuid(), 'Kick Two', 'food', 'two', null, 34.82, 135.65, 'en');
select tests.as_owner();

-- the kick returns early unless translation is on, not paused and work is due
select lives_ok('select app.translation_kick()', 'off: the kick does nothing');
update app.settings set int_value = 1 where key = 'translation_enabled';
select lives_ok('select app.translation_kick()', 'on, but nothing due yet: nothing');
update app.translation_jobs set next_attempt_at = now() - interval '1 second';
update app.translation_state set paused_until = now() + interval '1 hour', paused_reason = 'rate';
select lives_ok('select app.translation_kick()', 'due, but paused: nothing');

select ok(not exists (
    select 1 from unnest(array['public', 'anon', 'authenticated', 'service_role']) role,
                  unnest(array['app.translation_kick()', 'app.purge_translation_records()']) fn
    where has_function_privilege(role, fn::regprocedure, 'execute')),
  'no client role may run the kick or the cleanup');

-- cleanup: usage after 90 days, work that ran out of attempts 30 days ago
insert into app.translation_usage (day, chars) values
  ((now() at time zone 'UTC')::date - 91, 10), ((now() at time zone 'UTC')::date - 1, 20);
update app.translation_jobs set attempts = 5, enqueued_at = now() - interval '31 days' where place_id = tests.pid('p1');
update app.translation_jobs set attempts = 5, enqueued_at = now() - interval '1 day' where place_id = tests.pid('p2');
select app.purge_translation_records();
select is((select count(*)::int from app.translation_usage where day < (now() at time zone 'UTC')::date - 90), 0,
  'G-74 usage older than 90 days is gone');
select is((select count(*)::int from app.translation_usage where day = (now() at time zone 'UTC')::date - 1), 1,
  'recent usage stays');
select is((select count(*)::int from app.translation_jobs where place_id = tests.pid('p1')), 0,
  'work that failed a month ago is gone');
select is((select count(*)::int from app.translation_jobs where place_id = tests.pid('p2')), 1,
  'recent failed work stays for a look');

select * from finish();
rollback;
