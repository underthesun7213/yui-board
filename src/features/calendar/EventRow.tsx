import { go } from '../../actions/nav';
import { weekday } from '../../domain/calendar/dates';
import type { Occurrence } from '../../domain/types';
import { fill } from '../../i18n';
import { useT } from '../../i18n/useT';
import { LangBadge } from '../../ui/LangText';

export function EventRow({ o, today }: { o: Occurrence; today: string }) {
  const m = useT();
  const e = o.event;
  const past = o.date < today;
  return (
    <button
      className={'ev' + (past ? ' past' : '')}
      onClick={() => go({ name: 'event', id: e.id, date: o.date })}
    >
      <span className="clock">{o.start}</span>
      <h3 lang={e.lang}>{o.title}</h3>
      {o.place && (
        <p className="sub" lang={e.lang}>
          {o.place}
        </p>
      )}
      <div className="chips">
        {past && <span className="chip">{m.pastEv}</span>}
        {e.weekly_until && (
          <span className="chip rep">
            ↻ {fill(m.weeklyOn, { d: m.wd[weekday(e.start_date)]! })}
          </span>
        )}
        <LangBadge lang={e.lang} />
      </div>
    </button>
  );
}
