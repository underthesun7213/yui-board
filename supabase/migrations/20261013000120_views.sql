-- The public read API. These are definer views on purpose (security_invoker
-- = false): they run as their owner, so clients need no rights on `app`.
-- They call built-in functions only. Dates are Japan dates; no owner, token or
-- moderation column appears (V-3, V-4).

create view public.places_public with (security_invoker = false) as
select p.id, p.name, p.category::text as category, p.description, p.gmaps_url, p.lat, p.lng, p.pref,
       p.lang::text as lang,
       (p.created_at at time zone 'Asia/Tokyo')::date as created_on,
       (p.edited_at at time zone 'Asia/Tokyo')::date as edited_on
from app.places p
where p.deleted_at is null and p.auto_hidden_at is null and p.suspension_hidden_at is null;

create view public.events_public with (security_invoker = false) as
select e.id, e.title, e.start_date, e.start_time, e.end_time, e.weekly_until, e.place_text, e.body,
       e.lang::text as lang,
       (e.created_at at time zone 'Asia/Tokyo')::date as created_on,
       (e.edited_at at time zone 'Asia/Tokyo')::date as edited_on
from app.events e
where e.deleted_at is null and e.auto_hidden_at is null and e.suspension_hidden_at is null
  and e.last_date >= (now() at time zone 'Asia/Tokyo')::date - 365;

create view public.event_occurrences_public with (security_invoker = false) as
select o.event_id, o.occurs_on, o.cancelled, o.title, o.start_time, o.end_time, o.place_text, o.body
from app.event_occurrences o
join app.events e on e.id = o.event_id
where e.deleted_at is null and e.auto_hidden_at is null and e.suspension_hidden_at is null
  and e.last_date >= (now() at time zone 'Asia/Tokyo')::date - 365;

create view public.prefecture_counts with (security_invoker = false) as
select p.pref, count(*)::integer as n
from app.places p
where p.deleted_at is null and p.auto_hidden_at is null and p.suspension_hidden_at is null
group by p.pref;
