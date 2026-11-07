-- Place keywords (20261107000290): the fixed list, at most three, Card OK and
-- Cash only not together; the old write functions keep working; the admin
-- console tags places without editing them.
begin;
\ir _helpers.sql
select plan(24);

create temp table ids (k text primary key, v uuid);
insert into ids values ('a', tests.user()), ('b', tests.user()), ('adm', tests.user(false, 'owner@example.com'));
grant select on ids to public;
create function tests.id(text) returns uuid language sql as $$ select v from ids where k = $1 $$;
grant execute on function tests.id(text) to public;
create temp table r (k text primary key, v jsonb);
grant all on r to public;
create function tests.pid(text) returns bigint language sql as $$ select (v->>'id')::bigint from r where k = $1 $$;
grant execute on function tests.pid(text) to public;

create function tests.kw(p_kw text[]) returns text language sql as $$
  select coalesce(x->>'status', '') || ':' || coalesce(x->>'field', '')
  from (select public.create_place_v2(gen_random_uuid(), 'Spot', 'food', '', null, 34.8244, 135.6525, 'en', p_kw) x) y
$$;
grant execute on function tests.kw to public;

insert into app.admins (user_id, email) values (tests.id('adm'), 'owner@example.com');
create temp table sess (k text primary key, v uuid);
grant select on sess to public;
insert into sess values ('adm', gen_random_uuid());
insert into auth.sessions (id, user_id, created_at, aal)
values ((select v from sess where k = 'adm'), tests.id('adm'), now() - interval '1 hour', 'aal2');

select tests.as_user(tests.id('a'));
insert into r select 'p1', public.create_place_v2(gen_random_uuid(), 'Mandai', 'daily', '', null, 34.8244, 135.6525, 'en',
  array['photo', 'cheap', 'photo']);
select is((select v->>'status' from r where k = 'p1'), 'ok', 'create_place_v2 ok');
select is((select keywords from public.places_public where id = tests.pid('p1')), array['cheap', 'photo'],
  'stored in the list''s order, repeats dropped, and public');

-- malformed keywords are a status with the field
select is(tests.kw(array['wifi']), 'invalid:keywords', 'a keyword not on the list');
select is(tests.kw(array['']), 'invalid:keywords', 'an empty keyword');
select is(tests.kw(array['cheap', null]), 'invalid:keywords', 'a null keyword');
select is(tests.kw(array['cheap', 'late', 'free', 'bike']), 'invalid:keywords', 'four keywords');
select is(tests.kw(array['card', 'cash_only']), 'invalid:keywords', 'Card OK with Cash only');
select is(tests.kw(array['cheap', 'late', 'free']), 'ok:', 'three keywords');
select is(tests.kw(null), 'ok:', 'no keywords (null)');
select is(tests.kw('{}'), 'ok:', 'no keywords (empty)');

-- the old function still writes, with no keywords
insert into r select 'p2', public.create_place(gen_random_uuid(), 'Bakery', 'food', '', null, 34.8244, 135.6525, 'en');
select is((select keywords from public.places_public where id = tests.pid('p2')), '{}'::text[], 'create_place still works');

-- editing
select is(public.update_place_v2(tests.pid('p1'), 'Mandai', 'daily', '', null, 34.8244, 135.6525, 'en', array['late'])->>'status',
  'ok', 'update_place_v2 ok');
select is((select keywords from public.places_public where id = tests.pid('p1')), array['late'], 'keywords replaced');
select is(public.update_place(tests.pid('p1'), 'Mandai Store', 'daily', '', null, 34.8244, 135.6525, 'en')->>'status',
  'ok', 'the old update_place still works');
select is((select keywords from public.places_public where id = tests.pid('p1')), array['late'], 'and leaves the keywords alone');
select is(public.my_place(tests.pid('p1'))->'keywords', '["late"]'::jsonb, 'my_place returns them');
select is(public.update_place_v2(tests.pid('p1'), 'Mandai', 'daily', '', null, 34.8244, 135.6525, 'en', array['fast'])->>'field',
  'keywords', 'update_place_v2 checks them');
select tests.as_user(tests.id('b'));
select is(public.update_place_v2(tests.pid('p1'), 'Mine', 'daily', '', null, 34.8244, 135.6525, 'en', array['late'])->>'status',
  'not_found', 'someone else''s place');
select throws_ok($$select public.admin_set_keywords(tests.pid('p2'), array['cheap'])$$, '42501', null,
  'admin_set_keywords is for admins only');

-- the console tags a place: not an edit
select tests.as_owner();
create temp table before as select edited_at from app.places where id = tests.pid('p2');
grant select on before to public;
select tests.as_user(tests.id('adm'), jsonb_build_object('is_anonymous', false, 'aal', 'aal2',
  'session_id', (select v from sess where k = 'adm')));
select is(public.admin_set_keywords(tests.pid('p2'), array['halal', 'english'], 'tagging')->'keywords',
  '["english", "halal"]'::jsonb, 'admin_set_keywords ok');
select is(public.admin_set_keywords(tests.pid('p2'), array['card', 'cash_only'])->>'field', 'keywords', 'admin input checked too');
select is(public.admin_set_keywords(-1, array['cheap'])->>'status', 'not_found', 'an unknown place');
select tests.as_owner();
select ok((select p.edited_at is not distinct from b.edited_at from app.places p, before b where p.id = tests.pid('p2')),
  'the edit date stays');
select is((select detail from app.mod_actions where action = 'keywords' and target_id = tests.pid('p2')),
  '{"keywords": ["english", "halal"]}'::jsonb, 'logged with what was set');

select * from finish();
rollback;
