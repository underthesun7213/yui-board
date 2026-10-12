create table app.events (
  id bigint generated always as identity primary key,
  title text not null check (char_length(title) between 1 and 60 and title !~ '[[:cntrl:]]'),
  start_date date not null,
  start_time time not null,
  end_time time not null,
  weekly_until date,
  place_text text not null default '' check (char_length(place_text) <= 60 and place_text !~ '[[:cntrl:]]'),
  body text not null default '' check (char_length(body) <= 500),
  lang app.ui_lang not null,
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  deleted_at timestamptz,
  deleted_by text check (deleted_by in ('owner', 'admin')),
  auto_hidden_at timestamptz,
  suspension_hidden_at timestamptz,
  restored_at timestamptz,
  last_date date generated always as (coalesce(weekly_until, start_date)) stored,
  check (end_time > start_time),
  -- weekly: same weekday, at most 26 times (Y-K6)
  check (weekly_until is null or (weekly_until > start_date and weekly_until <= start_date + 175
                                  and (weekly_until - start_date) % 7 = 0)),
  check ((deleted_at is null) = (deleted_by is null))
);
alter table app.events enable row level security;
create index events_visible on app.events (last_date)
  where deleted_at is null and auto_hidden_at is null and suspension_hidden_at is null;
create index events_deleted on app.events (deleted_at) where deleted_at is not null;

-- One week of a weekly event changed or cancelled (Y-K7). Null = series value.
create table app.event_occurrences (
  event_id bigint not null references app.events (id) on delete cascade,
  occurs_on date not null,
  cancelled boolean not null default false,
  title text check (title is null or (char_length(title) between 1 and 60 and title !~ '[[:cntrl:]]')),
  start_time time,
  end_time time,
  place_text text check (place_text is null or (char_length(place_text) <= 60 and place_text !~ '[[:cntrl:]]')),
  body text check (body is null or char_length(body) <= 500),
  edited_at timestamptz not null default now(),
  primary key (event_id, occurs_on),
  check (end_time is null or start_time is null or end_time > start_time)
);
alter table app.event_occurrences enable row level security;

create table app.event_owners (
  event_id bigint primary key references app.events (id) on delete cascade,
  owner_id uuid not null references app.accounts (user_id) on delete cascade,
  client_token uuid not null,
  unique (owner_id, client_token)
);
alter table app.event_owners enable row level security;
create index event_owners_owner on app.event_owners (owner_id);
