import { useEffect, useState, type FormEvent } from 'react';
import { rpc } from './api';
import { fill, type AdminMessages } from './i18n';
import { admin, guarded } from './state';
import { useM, useWhen } from './useM';

export interface QueueRow {
  kind: 'place' | 'event';
  id: number;
  title: string;
  state: keyof AdminMessages['states'];
  protected: boolean;
  reports_open: number;
  reasons: Partial<Record<keyof AdminMessages['reasons'], number>>;
  first_report_at: string | null;
  last_report_at: string | null;
  account_ref: string | null;
  created_on: string;
  deleted_on: string | null;
}
type Filter = keyof AdminMessages['filters'];
const PAGE = 50;

/* Y-R4: hidden, reported, deleted or everything, with report counts by
   reason and the owner's pseudonym — never who reported (Y-R9). */
export function Queue() {
  const m = useM();
  const [filter, setFilter] = useState<Filter>('hidden');
  const [rows, setRows] = useState<QueueRow[] | null>(null);
  const [end, setEnd] = useState(false);
  const [failed, setFailed] = useState(false);
  const [seq, setSeq] = useState(0);
  const load = (f: Filter, offset: number) =>
    guarded(() =>
      rpc<QueueRow[]>('admin_queue', { p_filter: f, p_limit: PAGE, p_offset: offset }),
    ).then((r) => {
      setFailed(!r);
      if (!r) return;
      setRows((old) => (offset ? [...(old ?? []), ...r] : r));
      setEnd(r.length < PAGE);
    });
  useEffect(() => {
    let live = true;
    void guarded(() =>
      rpc<QueueRow[]>('admin_queue', { p_filter: filter, p_limit: PAGE, p_offset: 0 }),
    ).then((r) => {
      if (!live) return;
      setFailed(!r);
      setRows(r ?? []);
      setEnd((r ?? []).length < PAGE);
    });
    return () => {
      live = false;
    };
  }, [filter, seq]);
  return (
    <>
      <div className="seg" role="group">
        {(Object.keys(m.filters) as Filter[]).map((f) => (
          <button
            key={f}
            data-filter={f}
            aria-pressed={filter === f}
            onClick={() => (setRows(null), setFilter(f))}
          >
            {m.filters[f]}
          </button>
        ))}
      </div>
      {failed && (
        <p className="err" role="alert">
          {m.netError}
        </p>
      )}
      <Rows rows={rows} />
      {rows && !end && (
        <button className="secondary" onClick={() => void load(filter, rows.length)}>
          {m.more}
        </button>
      )}
      <BulkRestore onDone={() => setSeq((n) => n + 1)} />
    </>
  );
}

export type Row = Pick<QueueRow, 'kind' | 'id' | 'title' | 'state'> & Partial<QueueRow>;

export function Rows({ rows }: { rows: Row[] | null }) {
  const m = useM();
  if (!rows) return <p className="muted">{m.loading}</p>;
  if (!rows.length) return <p className="muted">{m.empty}</p>;
  return (
    <ul className="rows">
      {rows.map((r) => (
        <li key={`${r.kind}:${r.id}`}>
          <button
            data-item={`${r.kind}:${r.id}`}
            onClick={() => admin.set({ item: { kind: r.kind, id: r.id } })}
          >
            <span className="kind">{m.kinds[r.kind]}</span>
            <b>{r.title}</b>
            <span className={'state ' + r.state}>{m.states[r.state]}</span>
            {r.protected && <span className="tag">{m.protectedTag}</span>}
            {!!r.reports_open && (
              <span className="reports">
                {fill(m.reportsOpen, { n: r.reports_open })}
                {r.reasons &&
                  ' · ' +
                    (Object.keys(r.reasons) as (keyof AdminMessages['reasons'])[])
                      .map((k) => `${m.reasons[k]} ${r.reasons?.[k] ?? 0}`)
                      .join(', ')}
              </span>
            )}
            {r.account_ref && <span className="ref">{r.account_ref}</span>}
          </button>
        </li>
      ))}
    </ul>
  );
}

/* After a mass-report attack (runbook R-1): preview first, then restore. */
function BulkRestore({ onDone }: { onDone(): void }) {
  const m = useM();
  const when = useWhen();
  const [since, setSince] = useState('');
  const [until, setUntil] = useState('');
  const [preview, setPreview] = useState<{ kind: string; id: number; title: string }[] | null>(
    null,
  );
  const [msg, setMsg] = useState<string | null>(null);
  /* the inputs are Japan time, like everything the console shows */
  const iso = (local: string) => (local ? `${local}:00+09:00` : null);
  const call = (dry: boolean) =>
    guarded(() =>
      rpc<{ status: string; count?: number; items?: typeof preview }>('admin_restore_bulk', {
        p_since: iso(since),
        p_until: iso(until),
        p_note: 'bulk restore',
        p_dry_run: dry,
      }),
    );
  const look = async (e: FormEvent) => {
    e.preventDefault();
    setMsg(null);
    const r = await call(true);
    if (!r) return setMsg(m.netError);
    if (r.status !== 'ok') return setMsg(m.invalidPeriod);
    setPreview(r.items ?? []);
  };
  const run = async () => {
    const r = await call(false);
    if (!r || r.status !== 'ok') return setMsg(m.netError);
    setPreview(null);
    setMsg(fill(m.bulkDone, { n: r.count ?? 0 }));
    onDone();
  };
  return (
    <section className="box">
      <h2>{m.bulkT}</h2>
      <p className="muted">{m.bulkB}</p>
      <form className="row" onSubmit={(e) => void look(e)}>
        <label>
          {m.since}
          <input
            type="datetime-local"
            name="since"
            required
            value={since}
            onChange={(e) => (setSince(e.target.value), setPreview(null))}
          />
        </label>
        <label>
          {m.until}
          <input
            type="datetime-local"
            name="until"
            required
            value={until}
            onChange={(e) => (setUntil(e.target.value), setPreview(null))}
          />
        </label>
        <button className="secondary" type="submit" data-bulk="preview">
          {m.preview}
        </button>
      </form>
      {preview && (
        <>
          <p data-bulk-count={preview.length}>{fill(m.bulkCount, { n: preview.length })}</p>
          <ul className="plain">
            {preview.map((p) => (
              <li key={`${p.kind}:${p.id}`}>
                {m.kinds[p.kind as 'place' | 'event']} · {p.title}
              </li>
            ))}
          </ul>
          {preview.length > 0 && (
            <button className="primary" data-bulk="run" onClick={() => void run()}>
              {fill(m.bulkDo, { n: preview.length })}
            </button>
          )}
        </>
      )}
      {msg && <p role="status">{msg}</p>}
      {since && until && <p className="muted">{`${when(iso(since))} – ${when(iso(until))}`}</p>}
    </section>
  );
}
