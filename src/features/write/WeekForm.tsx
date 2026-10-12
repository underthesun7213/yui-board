import { useState } from 'react';
import { explain, resetWeek, saveWeek } from '../../actions/write';
import { formatDay, tokyoToday, weekday } from '../../domain/calendar/dates';
import { findOcc } from '../../domain/calendar/occurrences';
import { LIMITS } from '../../domain/validation';
import { LOCALE } from '../../i18n';
import { useT } from '../../i18n/useT';
import { data } from '../../state/data';
import { net } from '../../state/net';
import { prefs } from '../../state/prefs';
import { session } from '../../state/session';
import { useStore } from '../../state/useStore';
import { BackBar } from '../../ui/BackBar';
import { Field, WriteBlocked } from '../../ui/Field';

/* One week of a weekly event: cancel it, change it, or put it back (Y-K7). */
export function WeekForm({ id, date }: { id: number; date: string }) {
  const m = useT();
  const lang = useStore(prefs, (s) => s.lang);
  const schedule = useStore(data, (s) => s.schedule);
  const overrides = useStore(data, (s) => s.overrides);
  const mine = useStore(session, (s) => !!s.mineEvents[id]);
  const framed = useStore(session, (s) => s.framed);
  const online = useStore(net, (s) => s.online);
  const series = schedule.events.find((e) => e.id === id);
  const over = overrides.find((o) => o.event_id === id && o.occurs_on === date);
  const occ = findOcc(schedule, id, date);
  const [f, setF] = useState(() => ({
    title: occ?.title ?? series?.title ?? '',
    start_time: occ?.start ?? series?.start_time ?? '',
    end_time: occ?.end ?? series?.end_time ?? '',
    place_text: occ?.place ?? series?.place_text ?? '',
    body: occ?.body ?? series?.body ?? '',
  }));
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const title = `${m.editWeek} · ${formatDay(date, LOCALE[lang], { month: 'short', day: 'numeric' })} (${m.wd[weekday(date)]})`;
  if (!series || !series.weekly_until || !mine || date < tokyoToday()) {
    return (
      <>
        <BackBar title={m.editWeek} />
        <p className="empty">{series && date < tokyoToday() ? m.ePast : m.eNotFound}</p>
      </>
    );
  }
  const run = async (p: Promise<{ status: string }>) => {
    setBusy(true);
    const r = await p;
    setBusy(false);
    setErr(explain(r as Parameters<typeof explain>[0]));
  };
  const blocked = busy || !online || framed;
  const set = (k: keyof typeof f, v: string) => setF((x) => ({ ...x, [k]: v }));

  return (
    <>
      <BackBar title={title} />
      <div className="form">
        {over?.cancelled && <p className="dstatus warn">{m.weekCancelled}</p>}
        <div className="btns">
          {!over?.cancelled && (
            <button
              className="secondary"
              disabled={blocked}
              onClick={() => run(saveWeek(id, date, { ...f, cancelled: true }))}
            >
              {m.weekCancel}
            </button>
          )}
          {over && (
            <button
              className="secondary"
              disabled={blocked}
              onClick={() => run(resetWeek(id, date))}
            >
              {m.weekReset}
            </button>
          )}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void run(saveWeek(id, date, { ...f, cancelled: false }));
          }}
          noValidate
        >
          <Field id="wf-title" label={m.fTitle} count={[[...f.title].length, LIMITS.title]}>
            <input
              id="wf-title"
              value={f.title}
              maxLength={LIMITS.title}
              onChange={(e) => set('title', e.target.value)}
            />
          </Field>
          <div className="row2">
            <Field id="wf-start" label={m.fStart}>
              <input
                id="wf-start"
                type="time"
                value={f.start_time}
                onChange={(e) => set('start_time', e.target.value)}
              />
            </Field>
            <Field id="wf-end" label={m.fEnd}>
              <input
                id="wf-end"
                type="time"
                value={f.end_time}
                onChange={(e) => set('end_time', e.target.value)}
              />
            </Field>
          </div>
          <Field
            id="wf-place"
            label={m.fPlace}
            optional
            count={[[...f.place_text].length, LIMITS.place_text]}
          >
            <input
              id="wf-place"
              value={f.place_text}
              maxLength={LIMITS.place_text}
              onChange={(e) => set('place_text', e.target.value)}
            />
          </Field>
          <Field id="wf-body" label={m.fBody} optional count={[[...f.body].length, LIMITS.body]}>
            <textarea
              id="wf-body"
              rows={3}
              value={f.body}
              maxLength={LIMITS.body}
              onChange={(e) => set('body', e.target.value)}
            />
          </Field>
          <WriteBlocked online={online} framed={framed} />
          {err && (
            <p className="err" role="alert">
              {err}
            </p>
          )}
          <button type="submit" className="primary wide" disabled={blocked}>
            {busy ? m.saving : m.weekChange}
          </button>
        </form>
      </div>
    </>
  );
}
