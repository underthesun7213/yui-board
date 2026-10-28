import { go } from '../../actions/nav';
import { weekday } from '../../domain/calendar/dates';
import { inLang } from '../../domain/calendar/occurrences';
import type { Occurrence } from '../../domain/types';
import { fill } from '../../i18n';
import { useT } from '../../i18n/useT';
import { prefs } from '../../state/prefs';
import { useStore } from '../../state/useStore';
import { LangBadge } from '../../ui/LangText';

export function EventRow({ o, today }: { o: Occurrence; today: string }) {
  const m = useT();
  const ui = useStore(prefs, (s) => s.lang);
  const e = o.event;
  const past = o.date < today;
  const t = inLang(o, ui);
  return (
    <button
      className={'ev' + (past ? ' past' : '')}
      onClick={() => go({ name: 'event', id: e.id, date: o.date })}
    >
      <span className="clock">{o.start}</span>
      <h3 lang={t.title.lang}>{t.title.text}</h3>
      {o.place && (
        <p className="sub" lang={t.place.lang}>
          {t.place.text}
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
        {t.translated && <span className="chip">{m.autoTranslated}</span>}
      </div>
    </button>
  );
}
