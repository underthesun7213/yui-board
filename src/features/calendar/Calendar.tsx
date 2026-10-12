import { moveMonth, selectDay } from '../../actions/calendar';
import { formatDay, monthCells, tokyoToday } from '../../domain/calendar/dates';
import { occOn, upcoming } from '../../domain/calendar/occurrences';
import { fill, LOCALE } from '../../i18n';
import { useT } from '../../i18n/useT';
import { calendarUi } from '../../state/calendarUi';
import { data } from '../../state/data';
import { prefs } from '../../state/prefs';
import { useStore } from '../../state/useStore';
import { EventRow } from './EventRow';

export function Calendar() {
  const m = useT();
  const lang = useStore(prefs, (s) => s.lang);
  const day = useStore(calendarUi, (s) => s.day);
  const month = useStore(calendarUi, (s) => s.month);
  const schedule = useStore(data, (s) => s.schedule);
  const now = tokyoToday();
  const cur = month ?? now.slice(0, 7);
  const loc = LOCALE[lang];
  const stamp = (k: string) =>
    formatDay(k, loc, { month: 'short', day: 'numeric' }) +
    ' · ' +
    m.wd[new Date(k + 'T00:00:00Z').getUTCDay()];
  const sel = day?.startsWith(cur) ? day : null;
  const list = sel ? occOn(schedule, sel) : upcoming(schedule, now, 3);
  return (
    <>
      <div className="mnav">
        <button aria-label={m.aPrev} onClick={() => moveMonth(-1)}>
          ‹
        </button>
        <h1>{formatDay(cur + '-01', loc, { year: 'numeric', month: 'long' })}</h1>
        <button aria-label={m.aNext} onClick={() => moveMonth(1)}>
          ›
        </button>
      </div>
      <div className="wdrow" aria-hidden="true">
        {m.wdShort.map((w, i) => (
          <div key={i} className={'wd' + (i === 0 ? ' sun' : '')}>
            {w}
          </div>
        ))}
      </div>
      <div className="grid">
        {monthCells(cur).map((k, i) => {
          if (!k) return <div key={'x' + i} className="cell out" />;
          const n = occOn(schedule, k).length;
          return (
            <button
              key={k}
              data-d={k}
              className={'cell' + (k === now ? ' today' : '')}
              aria-pressed={day === k}
              aria-label={stamp(k)}
              onClick={() => selectDay(k)}
            >
              <b>{+k.slice(-2)}</b>
              <span className="cdots" aria-hidden="true">
                {Array.from({ length: Math.min(n, 3) }, (_, j) => (
                  <span key={j} className="cd" />
                ))}
                {n > 3 && <small>{fill(m.moreN, { n: n - 3 })}</small>}
              </span>
            </button>
          );
        })}
      </div>
      {sel ? (
        <>
          <div className="daylabel">{stamp(sel)}</div>
          {list.length ? (
            list.map((o) => <EventRow key={o.event.id} o={o} today={now} />)
          ) : (
            <p className="empty">{m.noEv}</p>
          )}
        </>
      ) : list.length ? (
        list.map((o) => (
          <div key={o.event.id + o.date}>
            <div className="daylabel">{stamp(o.date)}</div>
            <EventRow o={o} today={now} />
          </div>
        ))
      ) : (
        <p className="empty">{m.homeNone}</p>
      )}
    </>
  );
}
