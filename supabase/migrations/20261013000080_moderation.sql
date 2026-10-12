create table app.reports (
  id bigint generated always as identity primary key,
  place_id bigint references app.places (id) on delete cascade,
  event_id bigint references app.events (id) on delete cascade,
  reporter_id uuid references app.accounts (user_id) on delete set null,
  reason app.report_reason not null,
  by_owner boolean not null,
  resolution text not null default 'open' check (resolution in ('open', 'restored', 'deleted', 'dismissed')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  check (num_nonnulls(place_id, event_id) = 1),
  unique (place_id, reporter_id),
  unique (event_id, reporter_id)
);
alter table app.reports enable row level security;
create index reports_place_open on app.reports (place_id) where resolution = 'open';
create index reports_event_open on app.reports (event_id) where resolution = 'open';

create table app.mod_actions (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  actor_kind text not null check (actor_kind in ('admin', 'system')),
  actor_admin_id uuid references app.admins (user_id) on delete restrict,
  actor_email extensions.citext,
  action text not null check (action in ('auto_hide', 'restore', 'delete', 'dismiss', 'suspend', 'unsuspend')),
  target_kind text not null check (target_kind in ('place', 'event', 'account')),
  target_id bigint,
  account_ref text,
  detail jsonb,
  note text check (char_length(note) <= 500),
  check ((actor_kind = 'admin') = (actor_admin_id is not null))
);
alter table app.mod_actions enable row level security;

-- Append-only. Must be security invoker: as definer, current_user would be
-- the owner and the check below would mean nothing.
create function app.mod_actions_guard() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if tg_op = 'DELETE'
     and current_setting('app.purging', true) = 'on'
     and old.created_at < now() - interval '1 year' then
    return old;
  end if;
  raise exception using errcode = '42501', message = 'mod_actions is append-only';
end $$;
create trigger mod_actions_no_change before update or delete on app.mod_actions
  for each row execute function app.mod_actions_guard();
create trigger mod_actions_no_truncate before truncate on app.mod_actions
  for each statement execute function app.mod_actions_guard();
