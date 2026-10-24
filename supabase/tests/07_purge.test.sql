-- Cleanup and the append-only log: G-40~G-42, G-50, G-56.
begin;
\ir _helpers.sql
select plan(10);

create temp table u as select tests.user() as a;
insert into app.accounts (user_id) select a from u;
insert into app.places (name, category, lat, lng, pref, lang, deleted_at, deleted_by)
values ('old delete', 'food', 34.82, 135.65, '27', 'en', now() - interval '31 days', 'owner'),
       ('new delete', 'food', 34.82, 135.65, '27', 'en', now() - interval '29 days', 'owner');
insert into app.events (title, start_date, start_time, end_time, lang)
values ('long ago', tests.today() - 400, '10:00', '11:00', 'en'),
       ('recent', tests.today() - 10, '10:00', '11:00', 'en');
insert into app.security_events (kind, ip_key, at) values ('rate_limited_ip', '\x01', now() - interval '49 hours'),
                                                           ('rate_limited_ip', '\x02', now() - interval '1 hour');

select app.purge_deleted();
select is((select count(*)::int from app.places where name = 'old delete'), 0, 'deleted 31 days ago: gone (Y-E2)');
select is((select count(*)::int from app.places where name = 'new delete'), 1, 'deleted 29 days ago: kept');
select app.purge_past_events();
select is((select count(*)::int from app.events where title = 'long ago'), 0, 'over a year past: gone (Y-P5)');
select is((select count(*)::int from app.events where title = 'recent'), 1, 'recent past event: kept');
select app.purge_records();
select is((select count(*)::int from app.security_events where ip_key = '\x01'), 0, 'IP key dropped after 48 h (G-56)');
select is((select count(*)::int from app.security_events where ip_key = '\x02'), 1, 'recent IP key kept');

-- G-50: a year without writing removes the anonymous user, not their places
insert into app.place_owners (place_id, owner_id, client_token)
  select id, (select a from u), gen_random_uuid() from app.places where name = 'new delete';
update app.accounts set last_active_at = now() - interval '13 months' where user_id = (select a from u);
select app.purge_inactive_accounts();
select is((select count(*)::int from auth.users where id = (select a from u)), 0, 'inactive anonymous user removed');
select is((select count(*)::int from app.places where name = 'new delete'), 1, 'their place stays, without an owner');

-- G-40: the moderation log is append-only, even for the owner role
insert into app.mod_actions (actor_kind, action, target_kind, target_id) values ('system', 'auto_hide', 'place', 1);
select throws_ok('update app.mod_actions set note = $$x$$', '42501', 'mod_actions is append-only', 'no update');
select throws_ok('delete from app.mod_actions', '42501', 'mod_actions is append-only', 'no delete of recent rows');

select * from finish();
rollback;
