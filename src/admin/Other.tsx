import { useEffect, useState, type FormEvent } from 'react';
import type { Factor } from '@supabase/auth-js';
import { factors, rpc, unenroll } from './api';
import type { AdminMessages } from './i18n';
import { fill } from './i18n';
import { EnrollOne } from './Login';
import { Rows, type Row } from './Queue';
import { admin, guarded } from './state';
import { useM, useWhen } from './useM';

/* Y-R7: suspend or unsuspend by the pseudonymous account ID. */
export function Accounts() {
  const m = useM();
  const [ref, setRef] = useState('');
  const [note, setNote] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const act = async (fn: 'admin_suspend' | 'admin_unsuspend') => {
    if (fn === 'admin_suspend' && !confirm(m.confirmSuspend)) return;
    setMsg(null);
    const r = await guarded(() =>
      rpc<{ status: string }>(fn, { p_account_ref: ref.trim(), p_note: note || null }),
    );
    setMsg(!r ? m.netError : r.status === 'ok' ? m.done : m.notFound);
  };
  return (
    <form className="box" onSubmit={(e: FormEvent) => e.preventDefault()}>
      <p className="muted">{m.accountsB}</p>
      <label>
        {m.ref}
        <input
          name="ref"
          required
          pattern="a-[0-9a-f]{10}"
          value={ref}
          onChange={(e) => setRef(e.target.value)}
        />
      </label>
      <label>
        {m.note}
        <textarea
          name="note"
          maxLength={200}
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </label>
      <div className="btns">
        <button
          className="danger"
          type="button"
          disabled={!ref}
          onClick={() => void act('admin_suspend')}
        >
          {m.suspend}
        </button>
        <button
          className="secondary"
          type="button"
          disabled={!ref}
          onClick={() => void act('admin_unsuspend')}
        >
          {m.unsuspend}
        </button>
      </div>
      {msg && <p role="status">{msg}</p>}
    </form>
  );
}

/* Deletion requests from outside the app (Y-P6/P7): find by name or title. */
export function Search() {
  const m = useM();
  const [q, setQ] = useState('');
  const [pref, setPref] = useState('');
  const [rows, setRows] = useState<Row[] | null | undefined>(undefined);
  const find = async (e: FormEvent) => {
    e.preventDefault();
    setRows(null);
    const r = await guarded(() =>
      rpc<Row[]>('admin_search', { p_q: q, p_pref: /^\d{2}$/.test(pref) ? pref : null }),
    );
    setRows(r ?? []);
  };
  return (
    <>
      <form className="box row" onSubmit={(e) => void find(e)}>
        <label>
          {m.query}
          <input
            name="q"
            required
            maxLength={60}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>
        <label>
          {m.pref}
          <input
            name="pref"
            inputMode="numeric"
            pattern="\d{2}"
            maxLength={2}
            value={pref}
            onChange={(e) => setPref(e.target.value)}
          />
        </label>
        <button className="primary" type="submit">
          {m.find}
        </button>
      </form>
      {rows !== undefined && <Rows rows={rows} />}
    </>
  );
}

interface LogRow {
  id: number;
  created_at: string;
  actor_kind: 'admin' | 'system';
  actor_email: string | null;
  action: keyof AdminMessages['actions'];
  target_kind: keyof AdminMessages['kinds'];
  target_id: number | null;
  account_ref: string | null;
  note: string | null;
}

/* Y-R5: who did what, when — newest first. */
export function AuditLog() {
  const m = useM();
  const when = useWhen();
  const [rows, setRows] = useState<LogRow[] | null>(null);
  const [end, setEnd] = useState(false);
  const load = (before: number | null) =>
    guarded(() => rpc<LogRow[]>('admin_audit_log', { p_limit: 100, p_before: before })).then(
      (r) => {
        if (!r) return;
        setRows((old) => (before ? [...(old ?? []), ...r] : r));
        setEnd(r.length < 100);
      },
    );
  useEffect(() => {
    void guarded(() => rpc<LogRow[]>('admin_audit_log', { p_limit: 100 })).then((r) => {
      setRows(r ?? []);
      setEnd((r ?? []).length < 100);
    });
  }, []);
  if (!rows) return <p className="muted">{m.loading}</p>;
  if (!rows.length) return <p className="muted">{m.empty}</p>;
  return (
    <>
      <ul className="plain log" data-log="">
        {rows.map((r) => (
          <li key={r.id}>
            <span className="muted">{when(r.created_at)}</span> ·{' '}
            {r.actor_kind === 'system' ? m.system : r.actor_email} · <b>{m.actions[r.action]}</b> ·{' '}
            {r.target_kind === 'account' ? (
              `${m.kinds.account} ${r.account_ref ?? ''}`
            ) : (
              <button
                className="link"
                onClick={() =>
                  admin.set({
                    item: { kind: r.target_kind as 'place' | 'event', id: r.target_id ?? 0 },
                  })
                }
              >
                {m.kinds[r.target_kind]} #{r.target_id}
              </button>
            )}
            {r.note && ` — ${r.note}`}
          </li>
        ))}
      </ul>
      {!end && (
        <button className="secondary" onClick={() => void load(rows[rows.length - 1]!.id)}>
          {m.more}
        </button>
      )}
    </>
  );
}

/* The authenticators: replace a lost one with the other still in hand (R-7 ①). */
export function Security() {
  const m = useM();
  const when = useWhen();
  const [list, setList] = useState<Factor[] | null>(null);
  const [adding, setAdding] = useState(false);
  const load = () =>
    factors().then((f) => {
      setList(f?.verified ?? []);
      admin.set({ factorCount: f?.verified.length ?? 0 });
    });
  useEffect(() => {
    void factors().then((f) => {
      setList(f?.verified ?? []);
      admin.set({ factorCount: f?.verified.length ?? 0 });
    });
  }, []);
  if (!list) return <p className="muted">{m.loading}</p>;
  return (
    <section className="box">
      <h2>{m.factorsT}</h2>
      <ul className="plain" data-factors={list.length}>
        {list.map((f) => (
          <li key={f.id}>
            <b>{f.friendly_name || f.id.slice(0, 8)}</b>{' '}
            <span className="muted">{fill(m.factorAdded, { d: when(f.created_at) })}</span>{' '}
            {list.length > 1 && (
              <button
                className="link"
                onClick={async () => {
                  if (!confirm(m.confirmRemoveFactor)) return;
                  await unenroll(f.id);
                  await load();
                }}
              >
                {m.removeFactor}
              </button>
            )}
          </li>
        ))}
      </ul>
      {adding ? (
        <EnrollOne
          name={m.enrollBackup}
          onDone={() => {
            setAdding(false);
            void load();
          }}
        />
      ) : (
        <button className="secondary" onClick={() => setAdding(true)}>
          {m.addFactor}
        </button>
      )}
    </section>
  );
}
