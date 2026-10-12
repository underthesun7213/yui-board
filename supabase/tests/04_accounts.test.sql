-- Accounts: Y-A1 (created on first write), G-11 (suspended), G-14 (edits), G-38 (hourly cap).
begin;
\ir _helpers.sql
select plan(10);

create temp table ids (k text primary key, v uuid);
insert into ids values ('a', tests.user()), ('reader', tests.user()), ('new', tests.user());
grant select on ids to public;
create function tests.id(text) returns uuid language sql as $$ select v from ids where k = $1 $$;
grant execute on all functions in schema tests to public;

-- Y-A1: reading makes no account; the first write does
select tests.as_user(tests.id('reader'));
select public.my_items();
select tests.as_owner();
select is((select count(*)::int from app.accounts where user_id = tests.id('reader')), 0, 'reading creates no account');
select tests.as_user(tests.id('a'));
select is((public.create_place(gen_random_uuid(), 'x', 'food', '', null, 34.82, 135.65, 'en'))->>'status', 'ok', 'first write');
select tests.as_owner();
select is((select count(*)::int from app.accounts where user_id = tests.id('a')), 1, 'creates the account');
select matches((select ref from app.accounts where user_id = tests.id('a')), '^a-[0-9a-f]{10}$', 'with a pseudonym, not the uuid');

-- G-14: the 31st edit in a day is refused
select tests.as_owner();
create temp table pid as select place_id from app.place_owners where owner_id = tests.id('a');
grant select on pid to public;
select tests.as_user(tests.id('a'));
select is((select count(*)::int from (
  select public.update_place((select place_id from pid), 'x' || i, 'food', '', null, 34.82, 135.65, 'en') ->> 'status' s
  from generate_series(1, 30) i) x where s = 'ok'), 30, 'thirty edits a day');
select is((public.update_place((select place_id from pid), 'one more', 'food', '', null, 34.82, 135.65, 'en'))->>'status',
  'rate_limited', 'the 31st is refused');

-- G-11: a suspended account cannot write, but can delete its own (OQ-E2)
select tests.as_owner();
update app.accounts set suspended_at = now() where user_id = tests.id('a');
select tests.as_user(tests.id('a'));
select is((public.create_event(gen_random_uuid(), 'x', tests.today(), '10:00', '11:00', null, '', '', 'en'))->>'status',
  'suspended', 'suspended cannot create');
select is((public.delete_place((select place_id from pid)))->>'status', 'ok', 'suspended can delete their own');

-- G-38: when the hourly cap on new accounts is reached, a new person's first write is refused
select tests.as_owner();
update app.settings set int_value = (select count(*) from app.accounts where created_at > now() - interval '1 hour')::int
  where key = 'accounts_per_hour';
select tests.as_user(tests.id('new'));
select is((public.create_place(gen_random_uuid(), 'x', 'food', '', null, 34.82, 135.65, 'en'))->>'status',
  'rate_limited', 'over the hourly cap');
select tests.as_owner();
select is((select count(*)::int from app.accounts where user_id = tests.id('new')), 0, 'and no account is made');

select * from finish();
rollback;
