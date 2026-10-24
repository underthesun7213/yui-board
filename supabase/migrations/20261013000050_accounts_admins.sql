-- An account row appears on a person's first write (Y-A1). `ref` is the only
-- name an admin ever sees for it (Y-P2).
create table app.accounts (
  user_id uuid primary key references auth.users (id) on delete cascade,
  ref text not null unique default ('a-' || substr(encode(extensions.gen_random_bytes(6), 'hex'), 1, 10)),
  created_at timestamptz not null default now(),
  last_active_at timestamptz not null default now(),
  suspended_at timestamptz,
  suspended_note text check (char_length(suspended_note) <= 200)
);
alter table app.accounts enable row level security;
create index accounts_created on app.accounts (created_at);
create index accounts_last_active on app.accounts (last_active_at);

-- Invitations and admin rights are separate ([검토 #4]): the signup hook only
-- reads invites; admin checks only read `admins`, filled by bind_admin.
create table app.admin_invites (
  email extensions.citext primary key,
  invited_at timestamptz not null default now(),
  used_at timestamptz
);
alter table app.admin_invites enable row level security;

create table app.admins (
  user_id uuid primary key references auth.users (id) on delete restrict,
  email extensions.citext not null unique,
  active boolean not null default true,
  added_at timestamptz not null default now()
);
alter table app.admins enable row level security;

-- Run by the owner in the SQL editor with the id the Admin API returned when
-- creating the user — never by looking a user up by email ([재검토 #2]).
create function app.bind_admin(p_user_id uuid, p_email text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  u record;
  inv record;
begin
  select * into inv from app.admin_invites where lower(email::text) = lower(p_email) for update;
  if not found then raise exception 'admin_bind_no_invite'; end if;
  if inv.used_at is not null then raise exception 'admin_bind_invite_used'; end if;
  select id, email, is_anonymous, email_confirmed_at, created_at into u from auth.users where id = p_user_id;
  if not found then raise exception 'admin_bind_no_user'; end if;
  if u.is_anonymous or u.email_confirmed_at is null or lower(coalesce(u.email, '')) <> lower(p_email)
     or u.created_at <= inv.invited_at then
    raise exception 'admin_bind_rejected';
  end if;
  if exists (select 1 from auth.users where lower(email) = lower(p_email) and id <> p_user_id) then
    raise exception 'admin_bind_conflict';
  end if;
  insert into app.admins (user_id, email) values (p_user_id, p_email);
  update app.admin_invites set used_at = now() where lower(email::text) = lower(p_email);
end $$;
