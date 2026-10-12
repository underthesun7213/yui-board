-- Tunable limits. Changed with SQL; there is no screen for them.
create table app.settings (
  key text primary key,
  int_value integer not null
);
alter table app.settings enable row level security;
insert into app.settings (key, int_value) values
  ('report_hide_threshold', 3),
  ('place_create_per_day', 10),
  ('event_create_per_day', 10),
  ('edit_per_day', 30),
  ('report_per_day', 20),
  ('ip_writes_per_5min', 60),
  ('ip_writes_per_5min_dorm', 600),
  ('xff_trusted_hops', 1),          -- measured against the real project in Y-2 (OQ-E8)
  ('anon_signups_per_hour', 200),
  ('accounts_per_hour', 200),
  ('admin_session_hours', 12),
  ('deleted_retention_days', 30);

create function app.setting(p_key text) returns integer
language sql stable security definer set search_path = '' as $$
  select int_value from app.settings where key = p_key
$$;

-- Bumped by statement triggers whenever anything public changes, so clients
-- can poll one number instead of the data (RFC-0003 §11).
create table app.data_version (
  id integer primary key default 1 check (id = 1),
  v bigint not null default 0
);
alter table app.data_version enable row level security;
insert into app.data_version default values;

-- One random salt per day for pseudonymous IP keys; deleted after two days.
create table app.salts (
  day date primary key,
  salt bytea not null default extensions.gen_random_bytes(32)
);
alter table app.salts enable row level security;
