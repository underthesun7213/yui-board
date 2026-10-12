-- The per-IP write limit run by PostgREST before each request: G-52~G-56.
begin;
\ir _helpers.sql
select plan(17);

-- one request as PostgREST would set it up
create function tests.req(p_method text, p_path text, p_xff text) returns void
language plpgsql as $$
begin
  perform set_config('request.method', p_method, true);
  perform set_config('request.path', p_path, true);
  perform set_config('request.headers', jsonb_build_object('x-forwarded-for', p_xff)::text, true);
  perform app.db_pre_request();
end $$;
create function tests.hits() returns integer language sql security definer set search_path = '' as $$
  select coalesce(sum(n), 0)::integer from app.ip_hits
$$;
create function tests.req_n(p_n integer, p_xff text) returns integer
language plpgsql as $$
begin
  for i in 1 .. p_n loop
    perform tests.req('POST', '/rpc/create_place', p_xff);
  end loop;
  return p_n;
end $$;
grant execute on all functions in schema tests to public;
create temp table before as select tests.hits() as n;
grant select on before to public;
update app.settings set int_value = 3 where key = 'ip_writes_per_5min';
update app.settings set int_value = 5 where key = 'ip_writes_per_5min_dorm';
insert into app.ip_tiers (range, tier, note) values ('198.51.100.0/24', 'dorm', 'test range');

select tests.as_anon();
-- G-52: reads and polls are not counted
select lives_ok($$select tests.req('GET', '/rpc/data_version', '203.0.113.9')$$, 'GET poll passes');
select lives_ok($$select tests.req('GET', '/places_public', '203.0.113.9')$$, 'view read passes');
select lives_ok($$select tests.req('GET', '/rpc/my_items', '203.0.113.9')$$, 'GET of own items passes');
select is(tests.hits() - (select n from before), 0, 'none of them counted');
-- writes are counted, and the 4th in the window is refused
select lives_ok($$select tests.req('POST', '/rpc/create_place', '203.0.113.9')$$, 'write 1');
select lives_ok($$select tests.req('POST', '/rpc/update%5Fplace', '203.0.113.9')$$, 'write 2, its name percent-encoded: still counted');
select lives_ok($$select tests.req('PATCH', '/places_public', '203.0.113.9')$$, 'write 3, any non-read method');
select throws_ok($$select tests.req('POST', '/rpc/create_event', '203.0.113.9')$$, 'PT429', 'rate_limited', 'write 4 over the limit');

-- G-54: a client-sent address on the left is ignored; the proxy's (rightmost) counts
select lives_ok($$select tests.req('POST', '/rpc/create_place', '203.0.113.9, 192.0.2.50')$$,
  'same spoofed left value, new real address: allowed');

-- the dorm range gets its own, higher limit
select is(tests.req_n(5, '198.51.100.7'), 5, 'dorm address: five writes');
select throws_ok($$select tests.req('POST', '/rpc/create_place', '198.51.100.7')$$, 'PT429', 'rate_limited', 'dorm address: sixth refused');

-- G-53: an IPv6 /64 is one key
select tests.as_owner();
select is(app.ip_key('2001:db8:1:2::a'), app.ip_key('2001:db8:1:2::b'), 'same /64, same key');
select isnt(app.ip_key('2001:db8:1:2::a'), app.ip_key('2001:db8:1:3::a'), 'next /64, another key');

-- addresses as proxies write them
select is(app.client_ip('203.0.113.9:443'), '203.0.113.9'::inet, 'IPv4 with a port');
select is(app.client_ip('[2001:db8::1]:443'), '2001:db8::1'::inet, 'IPv6 in brackets with a port');
select is(app.client_ip('::ffff:198.51.100.7'), '198.51.100.7'::inet, 'IPv4-mapped IPv6 is the IPv4 address');
select is(app.client_ip('not an address'), null, 'garbage is no address');

select * from finish();
rollback;
