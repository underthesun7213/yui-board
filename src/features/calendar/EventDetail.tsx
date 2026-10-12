import { downloadIcs } from '../../actions/calendar';
import { formatDay, weekday } from '../../domain/calendar/dates';
import { findOcc } from '../../domain/calendar/occurrences';
import { LOCALE } from '../../i18n';
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
        <div className="btns">
          <button className="primary" data-ics onClick={() => downloadIcs(e.id, o.date)}>
            {m.ics}
          </button>
        </div>
      </div>
    </>
  );
}
