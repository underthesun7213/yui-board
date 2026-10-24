-- The admin console's functions (Y-R4~R7, Y-S3, ERD v2 §7.3). The console
-- calls them with POST, so even the reading ones are volatile: PostgREST runs
-- stable functions read-only, where db_pre_request cannot count the request. Every admin_*
-- function begins with `perform app.require_admin();`, which raises unless
-- the caller is an active allowlisted admin, not anonymous, at aal2, on a
-- session row younger than admin_session_hours ([검토 #3] fail-closed). The
-- checks migration verifies that first statement for every admin_% function.

-- Why a caller is not an admin, or null when they are.
create function app.admin_refusal() returns text
language plpgsql stable security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  claims jsonb := auth.jwt();
  sid uuid;
  created timestamptz;
  s_aal text;
  s_until timestamptz;
  hours integer := app.setting('admin_session_hours');
begin
  if uid is null then return 'no user'; end if;
  if coalesce((claims ->> 'is_anonymous')::boolean, true) then return 'anonymous'; end if;
  if coalesce(claims ->> 'aal', '') <> 'aal2' then return 'not aal2'; end if;
  begin
    sid := nullif(claims ->> 'session_id', '')::uuid;
  exception when others then
    return 'bad session id';
  end;
  if sid is null then return 'no session id'; end if;
  -- the session must still exist (signing out deletes it) and agree with the token
  select s.created_at, s.aal::text, s.not_after into created, s_aal, s_until
  from auth.sessions s where s.id = sid and s.user_id = uid;
  if not found or created is null then return 'no session'; end if;
  if s_aal is distinct from 'aal2' then return 'session not aal2'; end if;
  if s_until is not null and s_until <= now() then return 'session expired'; end if;
  -- a missing or broken limit refuses rather than lifting it
  if hours is null or hours <= 0 then return 'no session limit'; end if;
  if created < now() - make_interval(hours => hours) then return 'session expired'; end if;
  if not exists (select 1 from app.admins a where a.user_id = uid and a.active) then return 'not an admin'; end if;
  return null;
end $$;

create function app.require_admin() returns app.admins
language plpgsql stable security definer set search_path = '' as $$
declare
  a app.admins;
begin
  if app.admin_refusal() is not null then
    raise exception using errcode = '42501', message = 'forbidden';
  end if;
  select * into a from app.admins where user_id = auth.uid();
  return a;
end $$;

-- The one admin function that answers instead of raising, and records the
-- refusal: the console calls it first.
create function public.admin_whoami() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  why text := app.admin_refusal();
  sid uuid;
begin
  if why is not null then
    perform app.log_security('admin_denied', why);
    return jsonb_build_object('status', 'forbidden');
  end if;
  sid := (auth.jwt() ->> 'session_id')::uuid;
  return jsonb_build_object(
    'status', 'ok',
    'email', (select email::text from app.admins where user_id = auth.uid()),
    'session_expires_at', (select s.created_at + make_interval(hours => app.setting('admin_session_hours'))
                           from auth.sessions s where s.id = sid));
end $$;

create function app.item_state(p_deleted timestamptz, p_auto timestamptz, p_susp timestamptz) returns text
language sql immutable set search_path = '' as $$
  select case when p_deleted is not null then 'deleted'
              when p_auto is not null then 'auto_hidden'
              when p_susp is not null then 'suspension_hidden'
              else 'visible' end
$$;

create function app.log_admin(a app.admins, p_action text, p_kind text, p_id bigint, p_ref text,
                              p_detail jsonb, p_note text) returns void
language sql security definer set search_path = '' as $$
  insert into app.mod_actions (actor_kind, actor_admin_id, actor_email, action, target_kind, target_id,
                               account_ref, detail, note)
  values ('admin', a.user_id, a.email, p_action, p_kind, p_id, p_ref, p_detail, left(p_note, 500))
$$;

-- The queue (Y-R4): hidden, reported, deleted or all items, with report
-- counts by reason and the owner's pseudonym — never who reported (Y-R9).
create function public.admin_queue(p_filter text default 'all', p_limit integer default 50, p_offset integer default 0)
returns table (kind text, id bigint, title text, state text, protected boolean, reports_open integer,
               reasons jsonb, first_report_at timestamptz, last_report_at timestamptz, account_ref text,
               created_on date, deleted_on date)
language plpgsql security definer set search_path = '' as $$
#variable_conflict use_column
begin
  perform app.require_admin();
  return query
  with items as (
    select 'place'::text as kind, p.id, p.name as title,
           app.item_state(p.deleted_at, p.auto_hidden_at, p.suspension_hidden_at) as state,
           p.restored_at is not null as protected, p.created_at, p.deleted_at, a.ref as account_ref
    from app.places p left join app.place_owners o on o.place_id = p.id left join app.accounts a on a.user_id = o.owner_id
    union all
    select 'event', e.id, e.title, app.item_state(e.deleted_at, e.auto_hidden_at, e.suspension_hidden_at),
           e.restored_at is not null, e.created_at, e.deleted_at, a.ref
    from app.events e left join app.event_owners o on o.event_id = e.id left join app.accounts a on a.user_id = o.owner_id
  ), rep as (
    select case when r.place_id is not null then 'place' else 'event' end as kind,
           coalesce(r.place_id, r.event_id) as id,
           count(*) filter (where r.resolution = 'open' and not r.by_owner)::integer as n_open,
           min(r.created_at) as first_at, max(r.created_at) as last_at
    from app.reports r group by 1, 2
  ), why as (
    select k, i, jsonb_object_agg(reason, n) as reasons from (
      select case when r.place_id is not null then 'place' else 'event' end as k,
             coalesce(r.place_id, r.event_id) as i, r.reason::text as reason, count(*) as n
      from app.reports r where r.resolution = 'open' and not r.by_owner group by 1, 2, 3) t
    group by k, i
  )
  select it.kind, it.id, it.title, it.state, it.protected, coalesce(rep.n_open, 0), coalesce(why.reasons, '{}'::jsonb),
         rep.first_at, rep.last_at, it.account_ref,
         (it.created_at at time zone 'Asia/Tokyo')::date, (it.deleted_at at time zone 'Asia/Tokyo')::date
  from items it
  left join rep on rep.kind = it.kind and rep.id = it.id
  left join why on why.k = it.kind and why.i = it.id
  where case coalesce(p_filter, 'all')
          when 'hidden' then it.state in ('auto_hidden', 'suspension_hidden')
          when 'reported' then it.state <> 'deleted' and coalesce(rep.n_open, 0) > 0
          when 'deleted' then it.state = 'deleted'
          else true end
  order by coalesce(rep.last_at, it.deleted_at, it.created_at) desc, it.kind, it.id
  limit least(greatest(coalesce(p_limit, 50), 1), 200) offset greatest(coalesce(p_offset, 0), 0);
end $$;

-- One item in full: content, week changes, reports by reason (open and
-- handled), and its moderation history.
create function public.admin_item(p_kind app.item_kind, p_id bigint) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  item jsonb;
begin
  perform app.require_admin();
  if p_kind = 'place' then
    select to_jsonb(p) - 'restored_at' || jsonb_build_object(
             'state', app.item_state(p.deleted_at, p.auto_hidden_at, p.suspension_hidden_at),
             'protected', p.restored_at is not null, 'account_ref', a.ref,
             'account_suspended', a.suspended_at is not null)
      into item
    from app.places p left join app.place_owners o on o.place_id = p.id left join app.accounts a on a.user_id = o.owner_id
    where p.id = p_id;
  else
    select to_jsonb(e) - 'restored_at' || jsonb_build_object(
             'state', app.item_state(e.deleted_at, e.auto_hidden_at, e.suspension_hidden_at),
             'protected', e.restored_at is not null, 'account_ref', a.ref,
             'account_suspended', a.suspended_at is not null,
             'occurrences', coalesce((select jsonb_agg(to_jsonb(oc) - 'event_id' order by oc.occurs_on)
                                      from app.event_occurrences oc where oc.event_id = e.id), '[]'::jsonb))
      into item
    from app.events e left join app.event_owners o on o.event_id = e.id left join app.accounts a on a.user_id = o.owner_id
    where e.id = p_id;
  end if;
  if item is null then return jsonb_build_object('status', 'not_found'); end if;
  return jsonb_build_object(
    'status', 'ok',
    'item', item,
    'reports', coalesce((select jsonb_agg(jsonb_build_object('reason', reason, 'resolution', resolution, 'n', n))
                         from (select r.reason::text as reason, r.resolution, count(*) as n
                               from app.reports r
                               where not r.by_owner
                                 and (case when p_kind = 'place' then r.place_id else r.event_id end) = p_id
                               group by 1, 2) t), '[]'::jsonb),
    'history', coalesce((select jsonb_agg(jsonb_build_object('at', m.created_at, 'actor', coalesce(m.actor_email::text, 'system'),
                                                             'action', m.action, 'detail', m.detail, 'note', m.note)
                                          order by m.id desc)
                         from app.mod_actions m where m.target_kind = p_kind::text and m.target_id = p_id), '[]'::jsonb));
end $$;

-- Restore a hidden item: shown again and protected from auto-hide until its
-- owner edits it (Y-R4, Y-R6); its open reports are closed as restored. Only
-- hidden items, and never while the owner is suspended (Y-R7): unsuspend
-- first, then restore one by one.
create function app.restore_one(a app.admins, p_kind app.item_kind, p_id bigint, p_note text) returns text
language plpgsql security definer set search_path = '' as $$
declare
  ref text;
  susp boolean;
  owner uuid;
  n integer;
begin
  -- the owner's lock first, so a suspension committing meanwhile is seen
  if p_kind = 'place' then
    select o.owner_id into owner from app.place_owners o where o.place_id = p_id;
  else
    select o.owner_id into owner from app.event_owners o where o.event_id = p_id;
  end if;
  if owner is not null then perform pg_advisory_xact_lock(hashtextextended(owner::text, 0)); end if;
  if p_kind = 'place' then
    select ac.ref, ac.suspended_at is not null into ref, susp
    from app.place_owners o join app.accounts ac on ac.user_id = o.owner_id where o.place_id = p_id;
  else
    select ac.ref, ac.suspended_at is not null into ref, susp
    from app.event_owners o join app.accounts ac on ac.user_id = o.owner_id where o.event_id = p_id;
  end if;
  if coalesce(susp, false) then return 'account_suspended'; end if;
  if p_kind = 'place' then
    update app.places set auto_hidden_at = null, suspension_hidden_at = null, restored_at = now()
    where id = p_id and deleted_at is null and (auto_hidden_at is not null or suspension_hidden_at is not null);
  else
    update app.events set auto_hidden_at = null, suspension_hidden_at = null, restored_at = now()
    where id = p_id and deleted_at is null and (auto_hidden_at is not null or suspension_hidden_at is not null);
  end if;
  get diagnostics n = row_count;
  if n = 0 then return 'not_found'; end if;
  update app.reports set resolution = 'restored', resolved_at = now()
  where resolution = 'open' and (case when p_kind = 'place' then place_id else event_id end) = p_id;
  perform app.log_admin(a, 'restore', p_kind::text, p_id, ref, null, p_note);
  return 'ok';
end $$;

create function public.admin_restore(p_kind app.item_kind, p_id bigint, p_note text default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  a app.admins;
begin
  perform app.require_admin();
  a := app.require_admin();
  return jsonb_build_object('status', app.restore_one(a, p_kind, p_id, p_note));
end $$;

-- After a mass-report attack: restore everything auto-hidden in a period.
-- A dry run (the default) only lists what would change ([검토 #10]) with a
-- token for that exact list; the run passes the token back and stops if the
-- list changed meanwhile. The period ends now at the latest. Anything hidden
-- for a suspension — current or lifted — stays out: those come back one by one.
create function public.admin_restore_bulk(p_since timestamptz, p_until timestamptz, p_note text default null,
                                          p_dry_run boolean default true, p_expected text default null)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  a app.admins;
  targets jsonb;
  skipped integer;
  t record;
  n integer := 0;
  upto timestamptz;
begin
  perform app.require_admin();
  a := app.require_admin();
  upto := least(p_until, now());
  if p_since is null or p_until is null or upto <= p_since then return app.invalid('period'); end if;
  select coalesce(jsonb_agg(jsonb_build_object('kind', k, 'id', i, 'title', ti) order by k, i)
                    filter (where not susp), '[]'::jsonb),
         count(*) filter (where susp)
    into targets, skipped
  from (select 'place' as k, p.id as i, p.name as ti,
               ac.suspended_at is not null or p.suspension_hidden_at is not null as susp
        from app.places p left join app.place_owners o on o.place_id = p.id
        left join app.accounts ac on ac.user_id = o.owner_id
        where p.auto_hidden_at between p_since and upto and p.deleted_at is null
        union all
        select 'event', e.id, e.title, ac.suspended_at is not null or e.suspension_hidden_at is not null
        from app.events e left join app.event_owners o on o.event_id = e.id
        left join app.accounts ac on ac.user_id = o.owner_id
        where e.auto_hidden_at between p_since and upto and e.deleted_at is null) x;
  if coalesce(p_dry_run, true) then
    return jsonb_build_object('status', 'ok', 'dry_run', true, 'count', jsonb_array_length(targets),
                              'skipped_suspended', skipped, 'items', targets, 'token', md5(targets::text));
  end if;
  if p_expected is distinct from md5(targets::text) then
    return jsonb_build_object('status', 'changed', 'count', jsonb_array_length(targets),
                              'skipped_suspended', skipped, 'items', targets, 'token', md5(targets::text));
  end if;
  for t in select (x ->> 'kind')::app.item_kind as k, (x ->> 'id')::bigint as i from jsonb_array_elements(targets) x loop
    if app.restore_one(a, t.k, t.i, coalesce(p_note, 'bulk restore')) = 'ok' then n := n + 1; end if;
  end loop;
  return jsonb_build_object('status', 'ok', 'dry_run', false, 'count', n);
end $$;

-- Delete (Y-R4, Y-P7): gone from the app now, purged after 30 days.
create function public.admin_delete(p_kind app.item_kind, p_id bigint, p_note text default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  a app.admins;
  ref text;
  n integer;
begin
  perform app.require_admin();
  a := app.require_admin();
  if p_kind = 'place' then
    update app.places set deleted_at = now(), deleted_by = 'admin' where id = p_id and deleted_at is null;
    get diagnostics n = row_count;
    select ac.ref into ref from app.place_owners o join app.accounts ac on ac.user_id = o.owner_id where o.place_id = p_id;
  else
    update app.events set deleted_at = now(), deleted_by = 'admin' where id = p_id and deleted_at is null;
    get diagnostics n = row_count;
    select ac.ref into ref from app.event_owners o join app.accounts ac on ac.user_id = o.owner_id where o.event_id = p_id;
  end if;
  if n = 0 then return jsonb_build_object('status', 'not_found'); end if;
  update app.reports set resolution = 'deleted', resolved_at = now()
  where resolution = 'open' and (case when p_kind = 'place' then place_id else event_id end) = p_id;
  perform app.log_admin(a, 'delete', p_kind::text, p_id, ref, null, p_note);
  return jsonb_build_object('status', 'ok');
end $$;

-- Dismiss the reports on a visible item; the item stays as it is.
create function public.admin_dismiss(p_kind app.item_kind, p_id bigint, p_note text default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  a app.admins;
  n integer;
begin
  perform app.require_admin();
  a := app.require_admin();
  update app.reports set resolution = 'dismissed', resolved_at = now()
  where resolution = 'open' and (case when p_kind = 'place' then place_id else event_id end) = p_id;
  get diagnostics n = row_count;
  if n = 0 then return jsonb_build_object('status', 'not_found'); end if;
  perform app.log_admin(a, 'dismiss', p_kind::text, p_id, null, jsonb_build_object('reports', n), p_note);
  return jsonb_build_object('status', 'ok', 'count', n);
end $$;

-- Suspend an account (Y-R7): no more writing or reporting, and everything it
-- shows or that reports hid is marked hidden for the suspension, so no restore
-- brings it back while suspended. Takes the account's write lock first, so a
-- write already past its suspension check finishes before the items are hidden.
-- Unsuspending leaves the items hidden; restore them one by one.
create function public.admin_suspend(p_account_ref text, p_note text default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  a app.admins;
  uid uuid;
  n integer;
  m integer;
begin
  perform app.require_admin();
  a := app.require_admin();
  select user_id into uid from app.accounts where ref = p_account_ref and suspended_at is null;
  if uid is null then return jsonb_build_object('status', 'not_found'); end if;
  perform pg_advisory_xact_lock(hashtextextended(uid::text, 0));
  update app.accounts set suspended_at = now(), suspended_note = left(p_note, 200)
  where user_id = uid and suspended_at is null;
  get diagnostics n = row_count;
  if n = 0 then return jsonb_build_object('status', 'not_found'); end if;
  update app.places p set suspension_hidden_at = now()
  from app.place_owners o
  where o.place_id = p.id and o.owner_id = uid and p.deleted_at is null and p.suspension_hidden_at is null;
  get diagnostics n = row_count;
  update app.events e set suspension_hidden_at = now()
  from app.event_owners o
  where o.event_id = e.id and o.owner_id = uid and e.deleted_at is null and e.suspension_hidden_at is null;
  get diagnostics m = row_count;
  perform app.log_admin(a, 'suspend', 'account', null, p_account_ref,
                        jsonb_build_object('places_hidden', n, 'events_hidden', m), p_note);
  return jsonb_build_object('status', 'ok', 'places_hidden', n, 'events_hidden', m);
end $$;

create function public.admin_unsuspend(p_account_ref text, p_note text default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  a app.admins;
  uid uuid;
begin
  perform app.require_admin();
  a := app.require_admin();
  update app.accounts set suspended_at = null, suspended_note = null
  where ref = p_account_ref and suspended_at is not null
  returning user_id into uid;
  if uid is null then return jsonb_build_object('status', 'not_found'); end if;
  perform app.log_admin(a, 'unsuspend', 'account', null, p_account_ref, null, p_note);
  return jsonb_build_object('status', 'ok');
end $$;

-- Find an item by name or title (deletion requests from people outside the
-- app, Y-P6/P7). The pattern's own % and _ are matched literally.
create function public.admin_search(p_q text, p_pref char(2) default null)
returns table (kind text, id bigint, title text, state text, pref char(2), created_on date, account_ref text)
language plpgsql security definer set search_path = '' as $$
#variable_conflict use_column
declare
  pat text;
begin
  perform app.require_admin();
  if p_q is null or char_length(btrim(p_q)) < 1 or char_length(p_q) > 60 then return; end if;
  pat := '%' || replace(replace(replace(btrim(p_q), '\', '\\'), '%', '\%'), '_', '\_') || '%';
  return query
  select 'place'::text, p.id, p.name, app.item_state(p.deleted_at, p.auto_hidden_at, p.suspension_hidden_at), p.pref,
         (p.created_at at time zone 'Asia/Tokyo')::date, ac.ref
  from app.places p left join app.place_owners o on o.place_id = p.id left join app.accounts ac on ac.user_id = o.owner_id
  where p.name ilike pat and (p_pref is null or p.pref = p_pref)
  union all
  select 'event', e.id, e.title, app.item_state(e.deleted_at, e.auto_hidden_at, e.suspension_hidden_at), null::char(2),
         (e.created_at at time zone 'Asia/Tokyo')::date, ac.ref
  from app.events e left join app.event_owners o on o.event_id = e.id left join app.accounts ac on ac.user_id = o.owner_id
  where e.title ilike pat and p_pref is null
  order by 6 desc
  limit 100;
end $$;

-- The moderation log (Y-R5), newest first.
create function public.admin_audit_log(p_limit integer default 100, p_before bigint default null)
returns table (id bigint, created_at timestamptz, actor_kind text, actor_email text, action text,
               target_kind text, target_id bigint, account_ref text, detail jsonb, note text)
language plpgsql security definer set search_path = '' as $$
#variable_conflict use_column
begin
  perform app.require_admin();
  return query
  select m.id, m.created_at, m.actor_kind, m.actor_email::text, m.action, m.target_kind, m.target_id,
         m.account_ref, m.detail, m.note
  from app.mod_actions m
  where p_before is null or m.id < p_before
  order by m.id desc
  limit least(greatest(coalesce(p_limit, 100), 1), 500);
end $$;
