-- Reports (Y-R1~R3, ERD v2 §7.2). One per account per item; the owner's own
-- report is kept but not counted; enough distinct reporters hide the item.
create function public.submit_report(p_kind app.item_kind, p_id bigint, p_reason app.report_reason)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  st text;
  uid uuid;
  shown boolean;
  owner uuid;
  inserted integer;
begin
  st := app.require_writer();
  if st <> 'ok' then return jsonb_build_object('status', st); end if;
  uid := auth.uid();
  if p_kind is null or p_id is null then return app.invalid('target'); end if;
  if p_reason is null then return app.invalid('reason'); end if;

  -- only what the public sees can be reported; hidden ones are already in review
  if p_kind = 'place' then
    select (p.deleted_at is null and p.auto_hidden_at is null and p.suspension_hidden_at is null), o.owner_id
      into shown, owner
    from app.places p left join app.place_owners o on o.place_id = p.id where p.id = p_id;
  else
    select (e.deleted_at is null and e.auto_hidden_at is null and e.suspension_hidden_at is null), o.owner_id
      into shown, owner
    from app.events e left join app.event_owners o on o.event_id = e.id where e.id = p_id;
  end if;
  if not coalesce(shown, false) then return jsonb_build_object('status', 'not_found'); end if;

  if exists (select 1 from app.reports r where r.reporter_id = uid
             and (case when p_kind = 'place' then r.place_id else r.event_id end) = p_id) then
    return jsonb_build_object('status', 'already_reported');
  end if;
  if not app.take_quota('report', 'report_per_day') then return jsonb_build_object('status', 'rate_limited'); end if;

  -- whether the reporter owns it is decided before the insert (M-2)
  insert into app.reports (place_id, event_id, reporter_id, reason, by_owner)
  values (case when p_kind = 'place' then p_id end, case when p_kind = 'event' then p_id end,
          uid, p_reason, owner is not distinct from uid)
  on conflict do nothing;
  get diagnostics inserted = row_count;
  if inserted = 0 then return jsonb_build_object('status', 'already_reported'); end if;

  perform app.evaluate_item(p_kind, p_id);
  return jsonb_build_object('status', 'ok');
end $$;
