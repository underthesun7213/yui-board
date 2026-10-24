import { useEffect, useState } from 'react';
import { back } from '../../app/router';
import { dropDraft, explain, loadOwn, openDraft, saveDraft, saveEvent } from '../../actions/write';
import { addDays, tokyoToday } from '../../domain/calendar/dates';
import { LANGS, type EventSeries, type Lang } from '../../domain/types';
import { checkEvent, lastWeekMax, LIMITS, type EventInput } from '../../domain/validation';
import { LANG_NAME } from '../../i18n';
import { useT } from '../../i18n/useT';
import { data } from '../../state/data';
import { net } from '../../state/net';
import { prefs } from '../../state/prefs';
import { session } from '../../state/session';
import { useStore } from '../../state/useStore';
import { BackBar } from '../../ui/BackBar';
import { Captcha } from '../../ui/Captcha';
import { describedBy, Field, WriteBlocked } from '../../ui/Field';

/* Editing: the public copy, or one's own hidden event from the server (Y-E1). */
export function EventForm({ id }: { id?: number }) {
  const m = useT();
  const events = useStore(data, (s) => s.events);
  const mine = useStore(session, (s) => (id ? !!s.mineEvents[id] : true));
  const pub = id ? events.find((e) => e.id === id) : undefined;
  const [own, setOwn] = useState<EventSeries | null | undefined>(undefined);
  useEffect(() => {
    if (id && !pub) void loadOwn<EventSeries>('event', id).then(setOwn);
  }, [id, pub]);
  /* once resolved, the form keeps that copy: a poll that hides the item while
     it is being edited must not take the form away (React's "adjust state
     while rendering" pattern) */
  const [kept, setKept] = useState<EventSeries | undefined>(undefined);
  const found = pub ?? own ?? undefined;
  if (found && !kept) setKept(found);
  if (id && !kept && !pub && own === undefined) return <BackBar title={m.editEvent} />;
  const editing = kept ?? found;
  return (
    <EventFormBody key={editing?.id ?? 'new'} id={id} editing={editing} mine={mine || !!own} />
  );
}

function EventFormBody({
  id,
  editing,
  mine,
}: {
  id?: number;
  editing?: EventSeries;
  mine: boolean;
}) {
  const m = useT();
  const lang = useStore(prefs, (s) => s.lang);
  const hasAccount = useStore(session, (s) => s.hasAccount);
  const framed = useStore(session, (s) => s.framed);
  const online = useStore(net, (s) => s.online);
  /* the CAPTCHA switch is on: wait for the check */
  const waitCaptcha = useStore(session, (s) => s.captchaRequired && !s.captchaReady);
  const today = tokyoToday();

  const [draft] = useState(() =>
    editing
      ? {
          token: '',
          fields: {
            title: editing.title,
            start_date: editing.start_date,
            start_time: editing.start_time,
            end_time: editing.end_time,
            weekly_until: editing.weekly_until,
            place_text: editing.place_text,
            body: editing.body,
            lang: editing.lang,
          } satisfies EventInput,
        }
      : openDraft<EventInput>('event', {
          title: '',
          start_date: today,
          start_time: '18:00',
          end_time: '19:00',
          weekly_until: null,
          place_text: '',
          body: '',
          lang,
        }),
  );
  const [f, setF] = useState<EventInput>(draft.fields);
  const [err, setErr] = useState<{ field: string | null; msg: string } | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!id) saveDraft('event', { token: draft.token, fields: f });
  }, [id, draft.token, f]);

  if (id && (!editing || !mine)) {
    return (
      <>
        <BackBar title={m.editEvent} />
        <p className="empty">{m.eNotFound}</p>
      </>
    );
  }
  const lastDate = editing ? (editing.weekly_until ?? editing.start_date) : null;
  if (editing && lastDate! < today) {
    return (
      <>
        <BackBar title={m.editEvent} />
        <p className="empty">{m.pastNoEdit}</p>
      </>
    );
  }
  /* a series that has started keeps its first date (the server checks too) */
  const startLocked = !!editing && editing.start_date < today;

  const set = <K extends keyof EventInput>(k: K, v: EventInput[K]) =>
    setF((x) => ({ ...x, [k]: v }));
  const fieldErr = (k: string) => (err?.field === k ? err.msg : null);
  const weekly = f.weekly_until != null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const bad = checkEvent(f, today, startLocked);
    if (bad) return setErr({ field: bad, msg: m.inv[bad as keyof typeof m.inv] ?? m.inv.other });
    setBusy(true);
    const r = await saveEvent(f, { id, token: draft.token });
    setBusy(false);
    const why = explain(r);
    if (why) setErr({ field: r.status === 'invalid' ? (r.field ?? null) : null, msg: why });
  }

  return (
    <>
      <BackBar title={id ? m.editEvent : m.addEvent} />
      <form className="form" onSubmit={submit} noValidate>
        <Field
          id="ef-title"
          label={m.fTitle}
          error={fieldErr('title')}
          count={[[...f.title].length, LIMITS.title]}
        >
          <input
            id="ef-title"
            value={f.title}
            maxLength={LIMITS.title}
            autoComplete="off"
            aria-invalid={!!fieldErr('title')}
            onChange={(e) => set('title', e.target.value)}
          />
        </Field>
        <Field
          id="ef-date"
          label={m.fDate}
          hint={startLocked ? m.startedLocked : undefined}
          error={fieldErr('start_date')}
        >
          <input
            id="ef-date"
            type="date"
            value={f.start_date}
            min={startLocked ? undefined : today}
            disabled={startLocked}
            aria-invalid={!!fieldErr('start_date')}
            aria-describedby={describedBy('ef-date', startLocked, fieldErr('start_date'))}
            onChange={(e) => {
              const d = e.target.value;
              /* keep a weekly series on the new weekday */
              setF((x) => ({
                ...x,
                start_date: d,
                weekly_until: x.weekly_until != null && d ? addDays(d, 7) : x.weekly_until,
              }));
            }}
          />
        </Field>
        <div className="row2">
          <Field id="ef-start" label={m.fStart} error={fieldErr('time')}>
            <input
              id="ef-start"
              type="time"
              value={f.start_time}
              aria-invalid={!!fieldErr('time')}
              onChange={(e) => set('start_time', e.target.value)}
            />
          </Field>
          <Field id="ef-end" label={m.fEnd}>
            <input
              id="ef-end"
              type="time"
              value={f.end_time}
              onChange={(e) => set('end_time', e.target.value)}
            />
          </Field>
        </div>
        <label className="check">
          <input
            type="checkbox"
            checked={weekly}
            onChange={(e) =>
              set('weekly_until', e.target.checked ? addDays(f.start_date, 7) : null)
            }
          />
          {m.fWeekly}
        </label>
        {weekly && (
          <Field
            id="ef-until"
            label={m.fUntil}
            hint={m.fUntilHint}
            error={fieldErr('weekly_until')}
          >
            <input
              id="ef-until"
              type="date"
              value={f.weekly_until ?? ''}
              min={addDays(f.start_date, 7)}
              max={lastWeekMax(f.start_date)}
              step={7}
              aria-invalid={!!fieldErr('weekly_until')}
              aria-describedby={describedBy('ef-until', true, fieldErr('weekly_until'))}
              onChange={(e) => set('weekly_until', e.target.value)}
            />
          </Field>
        )}
        <Field
          id="ef-place"
          label={m.fPlace}
          optional
          error={fieldErr('place_text')}
          count={[[...f.place_text].length, LIMITS.place_text]}
        >
          <input
            id="ef-place"
            value={f.place_text}
            maxLength={LIMITS.place_text}
            onChange={(e) => set('place_text', e.target.value)}
          />
        </Field>
        <Field
          id="ef-body"
          label={m.fBody}
          optional
          error={fieldErr('body')}
          count={[[...f.body].length, LIMITS.body]}
        >
          <textarea
            id="ef-body"
            rows={4}
            value={f.body}
            maxLength={LIMITS.body}
            onChange={(e) => set('body', e.target.value)}
          />
        </Field>
        <Field id="ef-lang" label={m.fLang}>
          <select id="ef-lang" value={f.lang} onChange={(e) => set('lang', e.target.value as Lang)}>
            {LANGS.map((l) => (
              <option key={l} value={l}>
                {LANG_NAME[l]}
              </option>
            ))}
          </select>
        </Field>

        {!hasAccount && !id && <p className="note">{m.accountNote}</p>}
        <WriteBlocked online={online} framed={framed} />
        <Captcha />
        {err && !err.field && (
          <p className="err" role="alert">
            {err.msg}
          </p>
        )}
        <div className="btns">
          <button
            type="submit"
            className="primary"
            disabled={busy || !online || framed || waitCaptcha}
          >
            {busy ? m.saving : m.save}
          </button>
          {!id && (
            <button
              type="button"
              className="secondary"
              onClick={() => {
                dropDraft('event');
                back();
              }}
            >
              {m.cancel}
            </button>
          )}
        </div>
      </form>
    </>
  );
}
