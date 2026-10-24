import { downloadIcs } from '../../actions/calendar';
import { go } from '../../actions/nav';
import { openReport } from '../../actions/report';
import { session } from '../../state/session';
import { formatDay, tokyoToday, weekday } from '../../domain/calendar/dates';
import { findOcc } from '../../domain/calendar/occurrences';
import { fill, LOCALE } from '../../i18n';
import { useT } from '../../i18n/useT';
import { data } from '../../state/data';
import { prefs } from '../../state/prefs';
import { useStore } from '../../state/useStore';
import { BackBar } from '../../ui/BackBar';
import { LangBadge } from '../../ui/LangText';

export function EventDetail({ id, date }: { id: number; date: string }) {
  const m = useT();
  const lang = useStore(prefs, (s) => s.lang);
  const schedule = useStore(data, (s) => s.schedule);
  const mine = useStore(session, (s) => !!s.mineEvents[id]);
  const o = findOcc(schedule, id, date);
  if (!o) {
    return (
      <>
        <BackBar title={m.evT} />
        <p className="empty">{m.noEv}</p>
      </>
    );
  }
  const e = o.event;
  const today = tokyoToday();
  const over = (e.weekly_until ?? e.start_date) < today;
  const day = (d: string) =>
    formatDay(d, LOCALE[lang], { year: 'numeric', month: 'short', day: 'numeric' });
  const when = `${formatDay(o.date, LOCALE[lang], { month: 'long', day: 'numeric' })} (${m.wd[weekday(o.date)]}) ${o.start}–${o.end}`;
  return (
    <>
      <BackBar title={m.evT} />
      <div className="evwrap">
        <div className="when">{when}</div>
        <h1 lang={e.lang}>{o.title}</h1>
        <LangBadge lang={e.lang} />
        {o.place && (
          <dl className="facts">
            <div>
              <dt>{m.where}</dt>
              <dd lang={e.lang}>{o.place}</dd>
            </div>
          </dl>
        )}
        {o.body && (
          <div className="body" lang={e.lang}>
            {o.body}
          </div>
        )}
        <p className="dates">
          {fill(m.addedOn, { d: day(e.created_on) })}
          {e.edited_on && ' · ' + fill(m.editedOn, { d: day(e.edited_on) })}
        </p>
        <div className="btns">
          <button className="primary" data-ics onClick={() => downloadIcs(e.id, o.date)}>
            {m.ics}
          </button>
        </div>
        <p className="note">{m.icsNote}</p>
        {mine && (
          <div className="btns">
            <span className="mine">{m.mine}</span>
            {!over && (
              <button className="secondary" onClick={() => go({ name: 'eventEdit', id: e.id })}>
                {m.edit}
              </button>
            )}
            {e.weekly_until && o.date >= today && (
              <button
                className="secondary"
                onClick={() => go({ name: 'weekEdit', id: e.id, date: o.date })}
              >
                {m.editWeek}
              </button>
            )}
            <button
              className="secondary"
              onClick={() => void import('../../actions/write').then((w) => w.deleteEvent(e.id))}
            >
              {m.del}
            </button>
          </div>
        )}
        {!mine && (
          <button
            className="reportbtn"
            data-report-open="event"
            onClick={() => openReport({ kind: 'event', id: e.id })}
          >
            {m.report}
          </button>
        )}
      </div>
    </>
  );
}
