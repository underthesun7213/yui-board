import { useCallback, useEffect, useState } from 'react';
import { rpc } from './api';
import type { AdminMessages } from './i18n';
import { admin, guarded, type ItemRef } from './state';
import { useM, useWhen } from './useM';

type State = keyof AdminMessages['states'];
interface Item {
  status: 'ok' | 'not_found';
  item?: Record<string, unknown> & {
    state: State;
    protected: boolean;
    account_ref: string | null;
    account_suspended: boolean;
    created_at: string;
    edited_at: string | null;
    deleted_at: string | null;
    occurrences?: {
      occurs_on: string;
      cancelled: boolean;
      title: string | null;
      start_time: string | null;
      end_time: string | null;
    }[];
  };
  reports?: {
    reason: keyof AdminMessages['reasons'];
    resolution: keyof AdminMessages['resolutions'];
    n: number;
  }[];
  history?: {
    at: string;
    actor: string;
    action: keyof AdminMessages['actions'];
    note: string | null;
  }[];
}
const FIELDS = {
  place: ['name', 'category', 'description', 'gmaps_url', 'lat', 'lng', 'pref', 'lang'],
  event: [
    'title',
    'start_date',
    'start_time',
    'end_time',
    'weekly_until',
    'place_text',
    'body',
    'lang',
  ],
} as const;

const fetchItem = async (kind: ItemRef['kind'], id: number): Promise<Item> =>
  (await guarded(() => rpc<Item>('admin_item', { p_kind: kind, p_id: id }))) ?? {
    status: 'not_found',
  };

/* One item in full, and what can be done to it. Every value is shown as text;
   links are not made clickable here. */
export function ItemDetail({ at }: { at: ItemRef }) {
  const m = useM();
  const when = useWhen();
  const [d, setD] = useState<Item | null>(null);
  const [note, setNote] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const load = useCallback(() => fetchItem(at.kind, at.id).then(setD), [at.kind, at.id]);
  useEffect(() => {
    let live = true;
    void fetchItem(at.kind, at.id).then((r) => live && setD(r));
    return () => {
      live = false;
    };
  }, [at.kind, at.id]);
  const act = async (fn: string, args: Record<string, unknown>, ask?: string) => {
    if (ask && !confirm(ask)) return;
    setMsg(null);
    const r = await guarded(() => rpc<{ status: string }>(fn, { ...args, p_note: note || null }));
    if (!r) return setMsg(m.netError);
    setMsg(
      r.status === 'ok'
        ? m.done
        : r.status === 'account_suspended'
          ? m.restoreSuspended
          : m.notFound,
    );
    if (r.status === 'ok') setNote('');
    await load();
  };
  const back = (
    <button className="secondary" onClick={() => admin.set({ item: null })}>
      ‹ {m.back}
    </button>
  );
  if (!d) return <p className="muted">{m.loading}</p>;
  if (d.status !== 'ok' || !d.item)
    return (
      <>
        {back}
        <p className="muted">{m.notFound}</p>
      </>
    );
  const it = d.item;
  const target = { p_kind: at.kind, p_id: at.id };
  const open = (d.reports ?? []).filter((r) => r.resolution === 'open');
  return (
    <div className="detail" data-detail={`${at.kind}:${at.id}`}>
      {back}
      <p>
        <span className="kind">{m.kinds[at.kind]}</span>{' '}
        <span className={'state ' + it.state} data-state={it.state}>
          {m.states[it.state]}
        </span>
        {it.protected && <span className="tag">{m.protectedTag}</span>}
      </p>
      <dl className="facts">
        {FIELDS[at.kind].map((k) =>
          it[k] == null || it[k] === '' ? null : (
            <div key={k}>
              <dt>{m.fields[k]}</dt>
              <dd>{String(it[k])}</dd>
            </div>
          ),
        )}
        <div>
          <dt>{m.account}</dt>
          <dd data-ref={it.account_ref ?? ''}>
            {it.account_ref ?? '—'}
            {it.account_suspended && ` (${m.suspendedTag})`}
          </dd>
        </div>
        <div>
          <dt>{m.created}</dt>
          <dd>{when(it.created_at)}</dd>
        </div>
        {it.edited_at && (
          <div>
            <dt>{m.edited}</dt>
            <dd>{when(it.edited_at)}</dd>
          </div>
        )}
        {it.deleted_at && (
          <div>
            <dt>{m.deletedOn}</dt>
            <dd>{when(it.deleted_at)}</dd>
          </div>
        )}
      </dl>
      {!!it.occurrences?.length && (
        <>
          <h3>{m.weeksT}</h3>
          <ul className="plain">
            {it.occurrences.map((o) => (
              <li key={o.occurs_on}>
                {o.occurs_on}{' '}
                {o.cancelled
                  ? m.cancelled
                  : [o.title, o.start_time && `${o.start_time}–${o.end_time ?? ''}`]
                      .filter(Boolean)
                      .join(' · ')}
              </li>
            ))}
          </ul>
        </>
      )}
      <h3>{m.reportsT}</h3>
      {d.reports?.length ? (
        <ul className="plain" data-reports="">
          {d.reports.map((r) => (
            <li key={r.reason + r.resolution}>
              {m.reasons[r.reason]} — {m.resolutions[r.resolution]} × {r.n}
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">{m.empty}</p>
      )}
      <label className="note">
        {m.note}
        <textarea
          name="note"
          maxLength={500}
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </label>
      <div className="btns">
        {(it.state === 'auto_hidden' || it.state === 'suspension_hidden') && (
          <button
            className="primary"
            data-act="restore"
            onClick={() => void act('admin_restore', target)}
          >
            {m.restore}
          </button>
        )}
        {it.state === 'visible' && open.length > 0 && (
          <button
            className="secondary"
            data-act="dismiss"
            onClick={() => void act('admin_dismiss', target)}
          >
            {m.dismiss}
          </button>
        )}
        {it.state !== 'deleted' && (
          <button
            className="danger"
            data-act="delete"
            onClick={() => void act('admin_delete', target, m.confirmDelete)}
          >
            {m.del}
          </button>
        )}
        {it.account_ref &&
          (it.account_suspended ? (
            <button
              className="secondary"
              data-act="unsuspend"
              onClick={() => void act('admin_unsuspend', { p_account_ref: it.account_ref })}
            >
              {m.unsuspend}
            </button>
          ) : (
            <button
              className="danger"
              data-act="suspend"
              onClick={() =>
                void act('admin_suspend', { p_account_ref: it.account_ref }, m.confirmSuspend)
              }
            >
              {m.suspend}
            </button>
          ))}
      </div>
      {msg && (
        <p role="status" className="msg">
          {msg}
        </p>
      )}
      <h3>{m.historyT}</h3>
      {d.history?.length ? (
        <ul className="plain" data-history="">
          {d.history.map((h, i) => (
            <li key={i}>
              {when(h.at)} · {h.actor === 'system' ? m.system : h.actor} · {m.actions[h.action]}
              {h.note && ` — ${h.note}`}
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">{m.empty}</p>
      )}
    </div>
  );
}
