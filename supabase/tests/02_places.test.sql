-- Places: G-10, G-13, G-14, G-15, G-16, G-21, G-23 (places), G-27, Y-E1~E3.
begin;
\ir _helpers.sql
select plan(51);

create temp table ids (k text primary key, v uuid);
insert into ids values ('a', tests.user()), ('b', tests.user());
grant select on ids to public;
create function tests.id(text) returns uuid language sql as $$ select v from ids where k = $1 $$;
grant execute on function tests.id(text) to public;
create temp table r (k text primary key, v jsonb);
grant all on r to public;

create function tests.bad(p_name text, p_cat app.place_category, p_desc text, p_url text, p_lat float8, p_lng float8, p_lang app.ui_lang)
returns text language sql as $$
  select coalesce(r->>'status', '') || ':' || coalesce(r->>'field', '')
  from (select public.create_place(gen_random_uuid(), p_name, p_cat, p_desc, p_url, p_lat, p_lng, p_lang) r) x
$$;
grant execute on function tests.bad to public;

-- A creates a place at 結 (Osaka)
select tests.as_user(tests.id('a'));
insert into r select 'p1', public.create_place('00000000-0000-0000-0000-000000000001', '  Mandai  ', 'daily', 'cheap', 'https://maps.app.goo.gl/abc', 34.8244, 135.6525, 'en');
select is((select v->>'status' from r where k = 'p1'), 'ok', 'create_place ok');
select is((select v->>'pref' from r where k = 'p1'), '27', 'prefecture judged from the point: Osaka');
select is((select name from public.places_public where id = (select (v->>'id')::bigint from r where k = 'p1')), 'Mandai', 'name trimmed and public');

-- G-13: the same form twice is one place
insert into r select 'p1b', public.create_place('00000000-0000-0000-0000-000000000001', 'Mandai', 'daily', '', null, 34.8244, 135.6525, 'en');
select is((select v->>'status' from r where k = 'p1b'), 'duplicate', 'second send reports duplicate');
select is((select v->>'id' from r where k = 'p1b'), (select v->>'id' from r where k = 'p1'), 'and returns the same id');
select is((select count(*)::int from public.places_public where name = 'Mandai'), 1, 'one row');

-- G-15: malformed input is a status with the field, never an exception
select is(tests.bad('', 'food', '', null, 34.82, 135.65, 'en'), 'invalid:name', 'empty name');
select is(tests.bad(repeat('あ', 61), 'food', '', null, 34.82, 135.65, 'en'), 'invalid:name', '61 characters');
select is(tests.bad(repeat('あ', 60), 'food', '', null, 34.82, 135.65, 'en'), 'ok:', '60 characters is fine');
select is(tests.bad('a' || chr(10) || 'b', 'food', '', null, 34.82, 135.65, 'en'), 'invalid:name', 'control character in name');
select is(tests.bad('x', null, '', null, 34.82, 135.65, 'en'), 'invalid:category', 'no category');
select is(tests.bad('x', 'food', repeat('a', 501), null, 34.82, 135.65, 'en'), 'invalid:description', '501-character description');
select is(tests.bad('x', 'food', 'line one' || chr(10) || 'line two', null, 34.82, 135.65, 'en'), 'ok:', 'newlines allowed in description');
select is(tests.bad('x', 'food', '', 'javascript:alert(1)', 34.82, 135.65, 'en'), 'invalid:gmaps_url', 'javascript: link');
select is(tests.bad('x', 'food', '', 'http://www.google.com/maps/x', 34.82, 135.65, 'en'), 'invalid:gmaps_url', 'http link');
select is(tests.bad('x', 'food', '', 'https://evil.com/maps', 34.82, 135.65, 'en'), 'invalid:gmaps_url', 'other domain');
select is(tests.bad('x', 'food', '', 'https://google.com.evil.com/maps', 34.82, 135.65, 'en'), 'invalid:gmaps_url', 'lookalike domain');
select is(tests.bad('x', 'food', '', 'https://user@google.com/maps', 34.82, 135.65, 'en'), 'invalid:gmaps_url', 'userinfo trick');
select is(tests.bad('x', 'food', '', 'https://goo.gl/maps/x', 34.82, 135.65, 'en'), 'invalid:gmaps_url', 'retired goo.gl/maps');
select is(tests.bad('x', 'food', '', 'https://www.google.co.jp/maps/place/x', 34.82, 135.65, 'en'), 'ok:', 'google.co.jp/maps is fine');
select is(tests.bad('x', 'food', '', null, 37.5665, 126.978, 'en'), 'invalid:location', 'Seoul is outside Japan');
select is(tests.bad('ab' || chr(8238) || 'cd', 'food', '', null, 34.82, 135.65, 'en'), 'invalid:name', 'right-to-left override');
select is(tests.bad('a' || chr(8203) || 'b', 'food', '', null, 34.82, 135.65, 'en'), 'invalid:name', 'zero-width space');
select is(tests.bad(chr(12288) || chr(12288), 'food', '', null, 34.82, 135.65, 'en'), 'invalid:name', 'only ideographic spaces');
select is(tests.bad('x', 'food', 'a' || chr(8232) || 'b', null, 34.82, 135.65, 'en'), 'invalid:description', 'line separator');
select is(tests.bad('x', 'food', 'a' || chr(13) || 'b', null, 34.82, 135.65, 'en'), 'invalid:description', 'lone carriage return');
select is(tests.bad('x', 'food', 'a' || chr(9) || 'b', null, 34.82, 135.65, 'en'), 'ok:', 'tab is fine in a description');
select is(tests.bad('x', 'food', '', 'https://www.google.com/maps/../url?q=https://evil.example', 34.82, 135.65, 'en'),
  'invalid:gmaps_url', 'dot segments in a link');
select is(tests.bad('x', 'food', '', 'https://www.google.com/maps/%2e%2e/url', 34.82, 135.65, 'en'),
  'invalid:gmaps_url', 'encoded dot segments');
select is(tests.bad('x', 'food', '', null, 'Infinity', 135.65, 'en'), 'invalid:location', 'infinite coordinate');
select is(tests.bad('x', 'food', '', null, 30.0, 140.0, 'en'), 'invalid:location', 'open sea');
select is(tests.bad('x', 'food', '', null, 'NaN', 135.65, 'en'), 'invalid:location', 'NaN coordinate');
select is(tests.bad('x', 'food', '', null, 34.82, 135.65, null), 'invalid:lang', 'no language');
select tests.as_owner();
select ok((select count(*) from app.security_events where kind = 'invalid_input') >= 12, 'malformed input is recorded');
select tests.as_user(tests.id('a'));

-- G-16: SQL in a name is just text
select is(tests.bad($$'); drop table app.places; --$$, 'food', '', null, 34.82, 135.65, 'en'), 'ok:', 'SQL-looking name stored');
select ok((select count(*) from public.places_public where name like '%drop table%') = 1, 'and shown as text');

-- G-10: B cannot touch A's place
select tests.as_owner();
select tests.as_user(tests.id('b'));
select is((public.update_place((select (v->>'id')::bigint from r where k = 'p1'), 'mine', 'food', '', null, 34.82, 135.65, 'en'))->>'status',
  'not_found', 'B cannot edit A''s place');
select is((public.delete_place((select (v->>'id')::bigint from r where k = 'p1')))->>'status',
  'not_found', 'B cannot delete A''s place');
select tests.as_owner();
select is((select count(*)::int from app.security_events where kind = 'not_owner' and user_id = tests.id('b')), 2, 'both attempts recorded');

-- G-21: my_items shows only one's own
select tests.as_user(tests.id('b'));
select is((select count(*)::int from public.my_items() where kind = 'place'), 0, 'B owns nothing');
select tests.as_owner();
select tests.as_user(tests.id('a'));
select ok((select count(*) from public.my_items() where kind = 'place') >= 3, 'A sees their places');

-- Y-E1: editing shows an edited date
select is((public.update_place((select (v->>'id')::bigint from r where k = 'p1'), 'Mandai Hirakata', 'daily', '', null, 34.8204, 135.6524, 'ko'))->>'status',
  'ok', 'A edits their place');
select is((select edited_on from public.places_public where id = (select (v->>'id')::bigint from r where k = 'p1')),
  tests.today(), 'edited date shown');

-- G-27: a hidden place stays hidden when edited, and can still be deleted
select tests.as_owner();
update app.places set auto_hidden_at = now() where id = (select (v->>'id')::bigint from r where k = 'p1');
select tests.as_user(tests.id('a'));
select is((public.update_place((select (v->>'id')::bigint from r where k = 'p1'), 'Mandai 2', 'daily', '', null, 34.8204, 135.6524, 'ko'))->>'status',
  'ok', 'hidden place can be edited');
select is((select count(*)::int from public.places_public where id = (select (v->>'id')::bigint from r where k = 'p1')), 0,
  'and stays hidden (Y-E1)');
select is((select state from public.my_items() where kind = 'place' and id = (select (v->>'id')::bigint from r where k = 'p1')),
  'hidden_review', 'owner sees it as under review (Y-R8)');
select is((public.delete_place((select (v->>'id')::bigint from r where k = 'p1')))->>'status', 'ok', 'hidden place can be deleted (Y-E3)');
select is((select state from public.my_items() where kind = 'place' and id = (select (v->>'id')::bigint from r where k = 'p1')),
  'deleted', 'owner sees it deleted');
select is((public.update_place((select (v->>'id')::bigint from r where k = 'p1'), 'again', 'daily', '', null, 34.82, 135.65, 'ko'))->>'status',
  'not_found', 'a deleted place cannot be edited');

-- G-14: the 11th place in a day is refused
select tests.as_owner();
delete from app.write_log;
select tests.as_user(tests.id('b'));
select is((select count(*)::int from (select public.create_place(gen_random_uuid(), 'p' || i, 'food', '', null, 34.82, 135.65, 'en') ->> 'status' s
             from generate_series(1, 10) i) x where s = 'ok'), 10, 'ten places a day');
select is((public.create_place(gen_random_uuid(), 'eleven', 'food', '', null, 34.82, 135.65, 'en'))->>'status', 'rate_limited', 'the eleventh is refused');

select * from finish();
rollback;
