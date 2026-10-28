import { go } from '../../actions/nav';
import { ENDINGS } from '../../content/endings';
import { formatDay, tokyoToday, weekday } from '../../domain/calendar/dates';
import { inLang, upcoming } from '../../domain/calendar/occurrences';
import { fill, LOCALE } from '../../i18n';
import { useT } from '../../i18n/useT';
import { collection } from '../../state/collection';
import { data } from '../../state/data';
import { prefs } from '../../state/prefs';
import { useStore } from '../../state/useStore';
import { DataStatus } from '../../ui/DataStatus';

export function Home() {
  const m = useT();
  const lang = useStore(prefs, (s) => s.lang);
  const cg = useStore(collection, (s) => s.cg);
  const schedule = useStore(data, (s) => s.schedule);
  const got = ENDINGS.filter((e) => cg[e.id]).length;
  const nx = upcoming(schedule, tokyoToday(), 1)[0];
  const nxTitle = nx && inLang(nx, lang).title;
  return (
    <>
      <div className="hhead">
        <h1>{m.homeT}</h1>
      </div>
      <DataStatus />
      <div className="hcards">
        <button className="hcard jp" onClick={() => go({ name: 'learn' })}>
          <i aria-hidden="true">あ</i>
          <span>
            <b>{m.homeJp}</b>
            <em>{m.homeJpS}</em>
            <small>{fill(m.homeCol, { n: got, m: ENDINGS.length })}</small>
          </span>
        </button>
        <button className="hcard map" onClick={() => go({ name: 'map' })}>
          <i aria-hidden="true">◉</i>
          <span>
            <b>{m.homeMap}</b>
            <em>{m.homeMapS}</em>
          </span>
        </button>
        <button className="hcard cal" onClick={() => go({ name: 'cal' })}>
          <i aria-hidden="true">▦</i>
          <span>
            <b>{m.homeCal}</b>
            <em>{m.homeCalS}</em>
            <small>
              {nx ? (
                <>
                  {m.homeNext} ·{' '}
                  {formatDay(nx.date, LOCALE[lang], { month: 'short', day: 'numeric' })} ·{' '}
                  {m.wd[weekday(nx.date)]} <span lang={nxTitle!.lang}>{nxTitle!.text}</span>
                </>
              ) : (
                m.homeNone
              )}
            </small>
          </span>
        </button>
      </div>
      <button className="mylink" onClick={() => go({ name: 'me' })}>
        {m.myOpen} ›
      </button>
    </>
  );
}
