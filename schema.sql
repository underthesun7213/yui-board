-- =====================================================================
--  YUI community board — Supabase / Postgres schema
--
--  Core invariant: a post's text and its author live in different
--  tables, and the author table has no RLS policy at all. Nothing that
--  speaks to Postgres through PostgREST can read it — only a connection
--  using the service_role key, i.e. your own server code.
--
--  Everything that writes authored content goes through a SECURITY
--  DEFINER function so the two inserts happen in one transaction.
-- =====================================================================

-- ---------------------------------------------------------------- types
create type lang    as enum ('en','ja','ko');
create type board   as enum ('free','meet','unit','market','lost');
create type ev_kind as enum ('gip','office','student','ra');
create type place_cat as enum ('transit','daily','food','study','admin','health');
create type report_reason as enum ('identify','harass','sexual','spam','wrong','other');


-- =====================================================================
--  1. identity
--     auth.users holds the login. Residents sign in as <room>@yui.local,
--     so handing a room to a new resident is a rename of the auth row —
--     the uuid never moves, and authorship history stays correct.
-- =====================================================================

create table profiles (
  id           uuid primary key references auth.users on delete cascade,
  display_name text not null,
  instagram    text,
  lang         lang not null default 'en',
  is_admin     boolean not null default false,
  created_at   timestamptz not null default now()
);

-- Room number is stored but never exposed. Floor is what the UI shows.
create table residency (
  id         bigserial primary key,
  user_id    uuid not null references profiles on delete cascade,
  room       text not null,
  floor      smallint not null,
  active     boolean not null default true,
  started_on date not null default current_date,
  ended_on   date
);
create unique index residency_one_per_room on residency (room)    where active;
create unique index residency_one_per_user on residency (user_id) where active;

-- Which e-mail domains may register. A table, not a constant, because
-- exchange students arrive with domains nobody predicted.
create table allowed_domains (
  domain text primary key,
  note   text
);


-- =====================================================================
--  2. posts and comments
-- =====================================================================

create table posts (
  id            bigserial primary key,
  board         board not null,
  src_lang      lang not null,
  title_en text, title_ja text, title_ko text,
  body_en  text, body_ja  text, body_ko  text,
  translated    boolean not null default false,   -- false => MT failed, columns hold the original
  like_count    integer not null default 0,
  comment_count integer not null default 0,
  hidden_at     timestamptz,
  created_at    timestamptz not null default now()
);
create index posts_board_feed on posts (board, created_at desc) where hidden_at is null;
create index posts_feed       on posts (created_at desc)        where hidden_at is null;

-- RLS on, zero policies: unreachable except via service_role.
create table post_authors (
  post_id   bigint primary key references posts on delete cascade,
  author_id uuid   not null references profiles,
  created_at timestamptz not null default now()
);
create index post_authors_by_user on post_authors (author_id);

create table comments (
  id         bigserial primary key,
  post_id    bigint not null references posts on delete cascade,
  parent_id  bigint references comments on delete cascade,
  alias_no   smallint not null,                   -- "Anon 2" within this post
  is_op      boolean not null default false,
  src_lang   lang not null,
  body_en text, body_ja text, body_ko text,
  translated boolean not null default false,
  hidden_at  timestamptz,
  created_at timestamptz not null default now()
);
create index comments_thread on comments (post_id, created_at);

create table comment_authors (
  comment_id bigint primary key references comments on delete cascade,
  author_id  uuid   not null references profiles
);

-- Stable per-post anonymous numbering.
create table thread_aliases (
  post_id   bigint not null references posts on delete cascade,
  author_id uuid   not null references profiles,
  alias_no  smallint not null,
  primary key (post_id, author_id)
);
create unique index thread_alias_unique on thread_aliases (post_id, alias_no);

create table likes (
  post_id    bigint references posts on delete cascade,
  user_id    uuid   references profiles on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);


-- =====================================================================
--  3. moderation
--     Residents are anonymous. The operator is not: every hide is signed.
-- =====================================================================

create table reports (
  id          bigserial primary key,
  target_type text not null check (target_type in ('post','comment')),
  target_id   bigint not null,
  reason      report_reason not null,
  reporter_id uuid not null references profiles,  -- never selectable, kept for the record
  resolved_at timestamptz,
  created_at  timestamptz not null default now()
);
create unique index report_once_per_user
  on reports (target_type, target_id, reporter_id);

create table mod_actions (
  id          bigserial primary key,
  actor_id    uuid not null references profiles,
  target_type text not null check (target_type in ('post','comment')),
  target_id   bigint not null,
  action      text not null check (action in ('hide','unhide','keep')),
  created_at  timestamptz not null default now()
);


-- =====================================================================
--  4. profile exchange
--     Anonymous by default; identity crosses only on acceptance.
--     The requester's name and floor go out with the request itself —
--     that asymmetry is deliberate and is shown in the UI before sending.
-- =====================================================================

create table exchange_requests (
  id         bigserial primary key,
  from_user  uuid not null references profiles,
  to_user    uuid not null references profiles,
  post_id    bigint references posts on delete set null,
  status     text not null default 'pending'
             check (status in ('pending','accepted','declined')),
  created_at timestamptz not null default now(),
  check (from_user <> to_user)
);
create unique index exchange_one_pending
  on exchange_requests (from_user, to_user) where status = 'pending';
create index exchange_rate_limit on exchange_requests (from_user, created_at);

-- Accepted pairs, stored once with a canonical ordering.
create table exchanges (
  a          uuid not null references profiles,
  b          uuid not null references profiles,
  post_id    bigint references posts on delete set null,
  created_at timestamptz not null default now(),
  primary key (a, b),
  check (a < b)
);


-- =====================================================================
--  5. events
--     A weekly series is one row with an rrule, not forty rows.
--     Per-occurrence changes live in event_overrides.
-- =====================================================================

create table events (
  id         bigserial primary key,
  kind       ev_kind not null,
  host_label text not null,
  title_en text, title_ja text, title_ko text,
  body_en  text, body_ja  text, body_ko  text,
  place_en text, place_ja text, place_ko text,
  starts_at  timestamptz not null,
  ends_at    timestamptz,
  rrule      text,                  -- RFC 5545, null for one-offs
  until_on   date,
  capacity   integer,               -- null = no sign-up, just a headcount
  rsvp_count integer not null default 0,
  created_by uuid references profiles,
  created_at timestamptz not null default now()
);
create index events_window on events (starts_at);

create table event_overrides (
  event_id  bigint not null references events on delete cascade,
  occurs_on date   not null,
  cancelled boolean not null default false,
  title_en text, title_ja text, title_ko text,
  body_en  text, body_ja  text, body_ko  text,
  primary key (event_id, occurs_on)
);

create table event_rsvps (
  event_id   bigint references events on delete cascade,
  occurs_on  date not null,         -- which occurrence of a series
  user_id    uuid references profiles on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, occurs_on, user_id)
);


-- =====================================================================
--  6. places
-- =====================================================================

create table places (
  id              bigserial primary key,
  cat             place_cat not null,
  name_en text, name_ja text, name_ko text,
  note_en text, note_ja text, note_ko text,
  lat             double precision not null,
  lng             double precision not null,
  google_place_id text,
  walk_min        smallint,
  added_by        uuid references profiles,
  added_label     text,              -- 'RA', 'GIP', 'Anon' — shown instead of a name
  hidden_at       timestamptz,
  created_at      timestamptz not null default now()
);


-- =====================================================================
--  7. counters
-- =====================================================================

create or replace function bump_like_count() returns trigger
language plpgsql as $$
begin
  update posts set like_count = like_count + (case when tg_op='INSERT' then 1 else -1 end)
   where id = coalesce(new.post_id, old.post_id);
  return null;
end $$;
create trigger likes_count after insert or delete on likes
  for each row execute function bump_like_count();

create or replace function bump_comment_count() returns trigger
language plpgsql as $$
begin
  update posts set comment_count = comment_count + (case when tg_op='INSERT' then 1 else -1 end)
   where id = coalesce(new.post_id, old.post_id);
  return null;
end $$;
create trigger comments_count after insert or delete on comments
  for each row execute function bump_comment_count();


-- =====================================================================
--  8. helpers
-- =====================================================================

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from profiles where id = auth.uid()), false);
$$;

create or replace function is_resident() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from residency where user_id = auth.uid() and active);
$$;


-- =====================================================================
--  9. row level security
-- =====================================================================

alter table profiles          enable row level security;
alter table residency         enable row level security;
alter table allowed_domains   enable row level security;
alter table posts             enable row level security;
alter table post_authors      enable row level security;   -- no policies, on purpose
alter table comments          enable row level security;
alter table comment_authors   enable row level security;   -- no policies, on purpose
alter table thread_aliases    enable row level security;   -- no policies, on purpose
alter table likes             enable row level security;
alter table reports           enable row level security;
alter table mod_actions       enable row level security;
alter table exchange_requests enable row level security;
alter table exchanges         enable row level security;
alter table events            enable row level security;
alter table event_overrides   enable row level security;
alter table event_rsvps       enable row level security;
alter table places            enable row level security;

-- profiles: your own row only. Other people's names reach you through
-- the exchange views below, never through this table.
create policy profile_self on profiles
  for select using (id = auth.uid());
create policy profile_self_update on profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

create policy residency_self on residency
  for select using (user_id = auth.uid());

-- posts and comments: readable by any resident unless hidden.
create policy posts_read on posts
  for select using (hidden_at is null and is_resident());
create policy posts_read_admin on posts
  for select using (is_admin());
create policy comments_read on comments
  for select using (hidden_at is null and is_resident());
create policy comments_read_admin on comments
  for select using (is_admin());
-- inserts go through create_post / add_comment only: no insert policy here.
create policy posts_moderate on posts
  for update using (is_admin()) with check (is_admin());
create policy comments_moderate on comments
  for update using (is_admin()) with check (is_admin());

-- likes: you may see and change only your own.
create policy likes_self on likes
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- reports: you may file one; nobody may read the table, not even admins.
-- The operator reads report_queue instead.
create policy reports_insert on reports
  for insert with check (reporter_id = auth.uid() and is_resident());

create policy mod_actions_admin on mod_actions
  for all using (is_admin()) with check (is_admin());

-- exchange: you see requests addressed to you and ones you sent.
create policy exreq_mine on exchange_requests
  for select using (from_user = auth.uid() or to_user = auth.uid());
create policy exch_mine on exchanges
  for select using (a = auth.uid() or b = auth.uid());
create policy exch_delete_mine on exchanges
  for delete using (a = auth.uid() or b = auth.uid());

-- events, places: readable by residents, written by the operator.
create policy events_read  on events          for select using (is_resident());
create policy evov_read    on event_overrides for select using (is_resident());
create policy places_read  on places          for select using (hidden_at is null and is_resident());
create policy events_write on events          for all using (is_admin()) with check (is_admin());
create policy places_write on places          for all using (is_admin()) with check (is_admin());
create policy rsvp_self    on event_rsvps
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());


-- =====================================================================
--  10. views
--      Plain views run with the owner's rights, so they can read past
--      the policies above while enforcing their own condition.
-- =====================================================================

-- Contacts you have actually exchanged with.
create view my_contacts as
  select p.id, p.display_name, p.instagram, r.floor, e.post_id, e.created_at
    from exchanges e
    join profiles  p on p.id = case when e.a = auth.uid() then e.b else e.a end
    left join residency r on r.user_id = p.id and r.active
   where e.a = auth.uid() or e.b = auth.uid();

-- Requests waiting on you: the requester's name and floor, nothing else.
create view my_incoming_requests as
  select q.id, q.post_id, q.created_at,
         p.display_name, r.floor
    from exchange_requests q
    join profiles p on p.id = q.from_user
    left join residency r on r.user_id = q.from_user and r.active
   where q.to_user = auth.uid() and q.status = 'pending';

-- The operator's queue: reason, target and how many people reported it.
-- reporter_id is not in the projection and cannot be joined back.
create view report_queue as
  select r.target_type, r.target_id, r.reason,
         count(*) as n, max(r.created_at) as last_at
    from reports r
   where r.resolved_at is null and is_admin()
   group by r.target_type, r.target_id, r.reason;

revoke all on my_contacts, my_incoming_requests, report_queue from anon;
grant select on my_contacts, my_incoming_requests, report_queue to authenticated;


-- =====================================================================
--  11. write paths
--      Called from your server after it has translated the text.
--      These are the only way authored rows are created.
-- =====================================================================

create or replace function create_post(
  p_board board, p_src lang,
  p_title_en text, p_title_ja text, p_title_ko text,
  p_body_en  text, p_body_ja  text, p_body_ko  text,
  p_translated boolean
) returns bigint
language plpgsql security definer set search_path = public as $$
declare new_id bigint;
begin
  if not is_resident() then raise exception 'not a resident'; end if;

  insert into posts (board, src_lang, title_en, title_ja, title_ko,
                     body_en, body_ja, body_ko, translated)
       values (p_board, p_src, p_title_en, p_title_ja, p_title_ko,
               p_body_en, p_body_ja, p_body_ko, p_translated)
    returning id into new_id;

  insert into post_authors (post_id, author_id) values (new_id, auth.uid());
  insert into thread_aliases (post_id, author_id, alias_no) values (new_id, auth.uid(), 0);
  return new_id;
end $$;

create or replace function add_comment(
  p_post bigint, p_parent bigint, p_src lang,
  p_body_en text, p_body_ja text, p_body_ko text, p_translated boolean
) returns bigint
language plpgsql security definer set search_path = public as $$
declare new_id bigint; n smallint; op boolean;
begin
  if not is_resident() then raise exception 'not a resident'; end if;

  -- reuse this user's number in this thread, or hand out the next one
  select alias_no into n
    from thread_aliases where post_id = p_post and author_id = auth.uid();
  if n is null then
    select coalesce(max(alias_no), 0) + 1 into n
      from thread_aliases where post_id = p_post;
    insert into thread_aliases (post_id, author_id, alias_no)
         values (p_post, auth.uid(), n);
  end if;
  op := (n = 0);

  insert into comments (post_id, parent_id, alias_no, is_op, src_lang,
                        body_en, body_ja, body_ko, translated)
       values (p_post, p_parent, n, op, p_src,
               p_body_en, p_body_ja, p_body_ko, p_translated)
    returning id into new_id;

  insert into comment_authors (comment_id, author_id) values (new_id, auth.uid());
  return new_id;
end $$;

create or replace function request_exchange(p_post bigint)
returns bigint
language plpgsql security definer set search_path = public as $$
declare target uuid; new_id bigint;
begin
  if not is_resident() then raise exception 'not a resident'; end if;

  if (select count(*) from exchange_requests
       where from_user = auth.uid() and created_at > now() - interval '1 day') >= 3 then
    raise exception 'daily limit';
  end if;

  select author_id into target from post_authors where post_id = p_post;
  if target is null or target = auth.uid() then raise exception 'bad target'; end if;

  if exists (select 1 from exchanges
              where (a = least(auth.uid(), target) and b = greatest(auth.uid(), target))) then
    raise exception 'already exchanged';
  end if;

  insert into exchange_requests (from_user, to_user, post_id)
       values (auth.uid(), target, p_post)
    returning id into new_id;
  return new_id;
end $$;

create or replace function respond_exchange(p_req bigint, p_accept boolean)
returns void
language plpgsql security definer set search_path = public as $$
declare q exchange_requests;
begin
  select * into q from exchange_requests
   where id = p_req and to_user = auth.uid() and status = 'pending';
  if not found then raise exception 'no such request'; end if;

  update exchange_requests
     set status = case when p_accept then 'accepted' else 'declined' end
   where id = p_req;

  if p_accept then
    insert into exchanges (a, b, post_id)
         values (least(q.from_user, q.to_user), greatest(q.from_user, q.to_user), q.post_id)
    on conflict do nothing;
  end if;
end $$;

create or replace function submit_report(
  p_type text, p_id bigint, p_reason report_reason
) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_resident() then raise exception 'not a resident'; end if;
  insert into reports (target_type, target_id, reason, reporter_id)
       values (p_type, p_id, p_reason, auth.uid())
  on conflict (target_type, target_id, reporter_id) do nothing;
end $$;

-- Hiding is signed and reversible.
create or replace function moderate(p_type text, p_id bigint, p_action text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'not an operator'; end if;

  if p_action = 'hide' then
    if p_type = 'post' then update posts    set hidden_at = now() where id = p_id;
                        else update comments set hidden_at = now() where id = p_id; end if;
  elsif p_action = 'unhide' then
    if p_type = 'post' then update posts    set hidden_at = null where id = p_id;
                        else update comments set hidden_at = null where id = p_id; end if;
  end if;

  update reports set resolved_at = now()
   where target_type = p_type and target_id = p_id and resolved_at is null;

  insert into mod_actions (actor_id, target_type, target_id, action)
       values (auth.uid(), p_type, p_id, p_action);
end $$;

revoke all on function create_post, add_comment, request_exchange,
                      respond_exchange, submit_report, moderate from public;
grant execute on function create_post, add_comment, request_exchange,
                          respond_exchange, submit_report, moderate to authenticated;
