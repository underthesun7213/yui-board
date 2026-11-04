import { useState } from 'react';
import { go, openRoute } from '../../actions/nav';
import { installApp } from '../../actions/update';
import hero from '../../art/home/hero.webp';
import { CARD_IDS } from '../../content/card-ids';
import { formatDay, tokyoToday, weekday } from '../../domain/calendar/dates';
import { inLang, upcoming } from '../../domain/calendar/occurrences';
import { fill, LOCALE } from '../../i18n';
import { useT } from '../../i18n/useT';
import { collection } from '../../state/collection';
import { data } from '../../state/data';
import { prefs } from '../../state/prefs';
import { ui } from '../../state/ui';
import { useStore } from '../../state/useStore';
import { DataStatus } from '../../ui/DataStatus';

export function Home() {
  const m = useT();
  const lang = useStore(prefs, (s) => s.lang);
  const cg = useStore(collection, (s) => s.cg);
  const schedule = useStore(data, (s) => s.schedule);
  const got = CARD_IDS.filter((id) => cg[id]).length;
  const nx = upcoming(schedule, tokyoToday(), 1)[0];
  const nxTitle = nx && inLang(nx, lang).title;
  const install = useStore(ui, (s) => s.install);
  const [steps, setSteps] = useState(false);
  return (
    <>
      <div className="hhead">
        <h1>{m.homeT}</h1>
        {install !== 'no' && (
          <button
            className="install"
            aria-expanded={install === 'ios' ? steps : undefined}
            onClick={() => (install === 'ios' ? setSteps(!steps) : void installApp())}
          >
            ⊕ {m.install}
          </button>
        )}
      </div>
      {steps && install === 'ios' && <p className="hint installsteps">{m.installIos}</p>}
      <DataStatus />
      <div className="hcards">
        {/* Everyday Japanese, with episode 8's banner inside: a button cannot hold buttons */}
        <div className="hcard jp">
          <button onClick={() => go({ name: 'learn' })}>
            <i aria-hidden="true">あ</i>
            <span>
              <b>{m.homeJp}</b>
              <em>{m.homeJpS}</em>
              <small>{fill(m.homeCol, { n: got, m: CARD_IDS.length })}</small>
            </span>
          </button>
          <section className="hhero" aria-labelledby="hhero-t">
            <b id="hhero-t">{m.homeVnT}</b>
            <em>{m.homeVnS}</em>
            <div>
              <img src={hero} alt="" />
              {/* one button per side of the picture's diagonal line */}
              <button className="side kyoto" data-route="kyoto" onClick={() => openRoute('kyoto')}>
                <span>{m.homeVnKyoto} →</span>
              </button>
              <button className="side osaka" data-route="osaka" onClick={() => openRoute('osaka')}>
                <span>{m.homeVnOsaka} →</span>
              </button>
            </div>
          </section>
        </div>
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
      <button className="mylink legallink" onClick={() => go({ name: 'legal' })}>
        {m.legalLink} ›
      </button>
    </>
  );
}
