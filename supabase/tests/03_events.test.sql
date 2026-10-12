-- Events: Y-K4~K9, G-23 (all four views), G-29, data_version.
begin;
\ir _helpers.sql
select plan(27);

create temp table ids (k text primary key, v uuid);
insert into ids values ('a', tests.user()), ('b', tests.user());
grant select on ids to public;
create function tests.id(text) returns uuid language sql as $$ select v from ids where k = $1 $$;
create function tests.ev(p_start date, p_weekly date default null, p_title text default 'Board games')
returns jsonb language sql as $$
  select public.create_event(gen_random_uuid(), p_title, p_start, '17:00', '19:00', p_weekly, 'Lounge', 'Come by', 'en')
$$;
create temp table r (k text primary key, v jsonb);
grant all on r to public;
create function tests.r(text) returns bigint language sql as $$ select (v->>'id')::bigint from r where k = $1 $$;
grant execute on all functions in schema tests to public;

select tests.as_user(tests.id('a'));
-- Y-K4: today or later; end after start
select is((tests.ev(tests.today()))->>'status', 'ok', 'an event today');
select is((tests.ev(tests.today() - 1))->>'field', 'start_date', 'not in the past');
select is((public.create_event(gen_random_uuid(), 'x', tests.today(), '19:00', '19:00', null, '', '', 'en'))->>'field',
  'time', 'end must be after start');
select is((public.create_event(gen_random_uuid(), '', tests.today(), '17:00', '19:00', null, '', '', 'en'))->>'field',
  'title', 'title required');
select is((public.create_event(gen_random_uuid(), 'x', tests.today(), '17:00', '19:00', null, repeat('a', 61), '', 'en'))->>'field',
  'place_text', 'place at most 60');

-- Y-K6: weekly, same weekday, at most 26 times
insert into r select 'w', tests.ev(tests.today() + 1, tests.today() + 1 + 175);
select is((select v->>'status' from r where k = 'w'), 'ok', '26 weeks is fine');
select is((tests.ev(tests.today(), tests.today() + 182))->>'field', 'weekly_until', '27 weeks is too many');
select is((tests.ev(tests.today(), tests.today() + 10))->>'field', 'weekly_until', 'end must fall on the same weekday');

-- Y-K7: one week changed or cancelled
select is((public.set_occurrence(tests.r('w'), tests.today() + 8, false, 'Karaoke', null, null, null, null))->>'status',
  'ok', 'change one week');
select is((public.set_occurrence(tests.r('w'), tests.today() + 15, true, null, null, null, null, null))->>'status',
  'ok', 'cancel one week');
select is((public.set_occurrence(tests.r('w'), tests.today() + 9, true, null, null, null, null, null))->>'field',
  'occurs_on', 'a day that is not in the series');
select is((public.set_occurrence(tests.r('w'), tests.today() + 8, false, null, '20:00', null, null, null))->>'field',
  'time', 'changed start must stay before the end');
select is((select title from public.event_occurrences_public where event_id = tests.r('w') and occurs_on = tests.today() + 8),
  'Karaoke', 'the change is public');
select is((public.clear_occurrence(tests.r('w'), tests.today() + 8))->>'status', 'ok', 'undo a change');
select is((select count(*)::int from public.event_occurrences_public where event_id = tests.r('w')), 1, 'one change left');

-- moving the series drops changes that no longer land on its dates
select is((public.update_event(tests.r('w'), 'Board games', tests.today() + 2, '17:00', '19:00', tests.today() + 2 + 7, '', '', 'en'))->>'status',
  'ok', 'move a series that has not started');
select is((select count(*)::int from public.event_occurrences_public where event_id = tests.r('w')), 0, 'stray week changes removed');

-- Y-K8: only the owner
select tests.as_owner();
select tests.as_user(tests.id('b'));
select is((public.update_event(tests.r('w'), 'mine', tests.today() + 2, '17:00', '19:00', null, '', '', 'en'))->>'status',
  'not_found', 'B cannot edit A''s event');
select is((public.set_occurrence(tests.r('w'), tests.today() + 2, true, null, null, null, null, null))->>'status',
  'not_found', 'B cannot cancel A''s week');

-- G-29 / Y-K9: an event that is over cannot be edited, but can be deleted
select tests.as_owner();
insert into app.events (title, start_date, start_time, end_time, lang)
  values ('Past', tests.today() - 3, '10:00', '11:00', 'en') returning id \gset past_
insert into app.event_owners (event_id, owner_id, client_token)
  select :past_id, tests.id('a'), gen_random_uuid() from app.accounts where user_id = tests.id('a');
select tests.as_user(tests.id('a'));
select is((public.update_event(:past_id, 'Past 2', tests.today() - 3, '10:00', '11:00', null, '', '', 'en'))->>'status',
  'past_event', 'past event cannot be edited');
select is((public.delete_event(:past_id))->>'status', 'ok', 'but can be deleted');

-- G-23: hidden or deleted events leave every view, their week changes too
insert into r select 'h', tests.ev(tests.today() + 7, tests.today() + 21, 'Hidden one');
select public.set_occurrence(tests.r('h'), tests.today() + 14, true, null, null, null, null, null);
select tests.as_owner();
update app.events set auto_hidden_at = now() where id = tests.r('h');
select is((select count(*)::int from public.events_public where id = tests.r('h')), 0, 'auto-hidden event not public');
select is((select count(*)::int from public.event_occurrences_public where event_id = tests.r('h')), 0, 'nor its week changes');
update app.events set auto_hidden_at = null, suspension_hidden_at = now() where id = tests.r('h');
select is((select count(*)::int from public.events_public where id = tests.r('h')), 0, 'suspension-hidden event not public');
update app.events set suspension_hidden_at = null, deleted_at = now(), deleted_by = 'owner' where id = tests.r('h');
select is((select count(*)::int from public.event_occurrences_public where event_id = tests.r('h')), 0, 'deleted event''s weeks not public');

-- data_version moves on every change
select ok((select public.data_version()) > 0, 'data_version counts changes');
select tests.as_owner();
select is((select count(*)::int from public.prefecture_counts where n < 0), 0, 'prefecture_counts is sane');

select * from finish();
rollback;
