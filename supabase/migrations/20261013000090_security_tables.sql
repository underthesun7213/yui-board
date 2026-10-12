-- Per-account write counts for the daily limits (Y-A3). Kept 48 hours.
create table app.write_log (
  id bigint generated always as identity primary key,
  user_id uuid not null references app.accounts (user_id) on delete cascade,
  action text not null check (action in ('place_create', 'event_create', 'edit', 'report')),
  at timestamptz not null default now()
);
alter table app.write_log enable row level security;
create index write_log_user on app.write_log (user_id, action, at desc);

-- Per-IP write counts in 5-minute windows. The key is a salted hash of the
-- IPv4 address or IPv6 /64 — pseudonymous, not anonymous (V-8). Kept 1 hour.
create table app.ip_hits (
  ip_key bytea not null,
  window_start timestamptz not null,
  n integer not null default 0,
  primary key (ip_key, window_start)
);
alter table app.ip_hits enable row level security;

-- Building addresses (the dorm's public IP), not people: stored as is.
create table app.ip_tiers (
  range cidr primary key,
  tier text not null check (tier in ('dorm')),
  note text
);
alter table app.ip_tiers enable row level security;

create table app.security_events (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  kind text not null check (kind in ('forbidden', 'not_owner', 'rate_limited_account', 'rate_limited_ip',
                                     'suspended_write', 'admin_denied', 'signup_throttled', 'invalid_input')),
  user_id uuid references auth.users (id) on delete set null,
  ip_key bytea,
  detail text check (char_length(detail) <= 200)
);
alter table app.security_events enable row level security;
create index security_events_at on app.security_events (at);
