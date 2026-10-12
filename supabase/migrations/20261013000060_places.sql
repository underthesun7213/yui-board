create table app.places (
  id bigint generated always as identity primary key,
  name text not null check (char_length(name) between 1 and 60 and name !~ '[[:cntrl:]]'),
  category app.place_category not null,
  description text not null default '' check (char_length(description) <= 500),
  gmaps_url text check (
    gmaps_url is null
    or (char_length(gmaps_url) <= 500
        and gmaps_url ~ '^https://((www\.)?google\.(com|co\.jp)/maps([/?#]|$)|maps\.app\.goo\.gl/)')
  ),
  lat double precision not null check (lat between 20 and 46),
  lng double precision not null check (lng between 122 and 154),
  pref char(2) not null references app.prefectures (code),
  lang app.ui_lang not null,
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  deleted_at timestamptz,
  deleted_by text check (deleted_by in ('owner', 'admin')),
  auto_hidden_at timestamptz,
  suspension_hidden_at timestamptz,
  restored_at timestamptz,
  check ((deleted_at is null) = (deleted_by is null))
);
alter table app.places enable row level security;
create index places_visible on app.places (pref)
  where deleted_at is null and auto_hidden_at is null and suspension_hidden_at is null;
create index places_deleted on app.places (deleted_at) where deleted_at is not null;

-- Ownership kept apart from the item, so a public view can never leak it.
create table app.place_owners (
  place_id bigint primary key references app.places (id) on delete cascade,
  owner_id uuid not null references app.accounts (user_id) on delete cascade,
  client_token uuid not null,
  unique (owner_id, client_token)
);
alter table app.place_owners enable row level security;
create index place_owners_owner on app.place_owners (owner_id);
