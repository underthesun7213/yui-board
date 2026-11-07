import { useState } from 'react';
import '../../styles/keywords.css';
import { reload } from '../../actions/app';
import { go } from '../../actions/nav';
import { openReport } from '../../actions/report';
import { formatDay } from '../../domain/calendar/dates';
import { safeMapsUrl } from '../../domain/links';
import { session } from '../../state/session';
import {
  selectPref,
  setCat,
  setKeyword,
  setMode,
  skipLocation,
  togglePlace,
  useLocation,
} from '../../actions/map';
import { KEYWORD_TEXT } from '../../content/keywords';
import { CAT } from '../../domain/categories';
import { KEYWORDS, knownKeywords } from '../../domain/keywords';
import { distM, HOME, prefName, regionOf, shownPlaces, type Region } from '../../domain/geo/geo';
import { PREFS } from '../../domain/geo/prefs';
import { CATEGORIES, type LatLng, type Place } from '../../domain/types';
import { fill, LOCALE } from '../../i18n';
import { useT } from '../../i18n/useT';
import { MapSlot } from '../../map/MapSlot';
import { data } from '../../state/data';
import { location } from '../../state/location';
import { mapUi } from '../../state/mapUi';
import { prefIntro } from '../../state/prefIntro';
import { prefs } from '../../state/prefs';
import { useStore } from '../../state/useStore';
import { DataStatus } from '../../ui/DataStatus';
import { Described, LangBadge } from '../../ui/LangText';

export function MapScreen() {
  const m = useT();
  const mapFail = useStore(mapUi, (s) => s.mapFail);
  return (
    <>
      <div className="pagehead withadd">
        <h1>{m.mapT}</h1>
        <button className="addbtn" onClick={() => go({ name: 'placeNew' })}>
          ＋ {m.addPlace}
        </button>
      </div>
      <ModeBar />
      <DataStatus />
      <StatusBar />
      <CategoryChips />
      <KeywordChips />
      {mapFail ? (
        /* a failed chunk import stays failed until the page reloads */
        <div className="maperr" role="alert">
          <p>{m.mapFail}</p>
          <button className="secondary" onClick={reload}>
            {m.reload}
          </button>
        </div>
      ) : (
        <MapSlot loading={m.mapLoading} />
      )}
      <PlaceCard />
      <PlaceList />
    </>
  );
}

function ModeBar() {
  const m = useT();
  const mode = useStore(mapUi, (s) => s.mode);
  return (
    <div className="seg" role="group" aria-label={m.aModes}>
      {(['near', 'japan'] as const).map((k) => (
        <button key={k} data-mode={k} aria-pressed={mode === k} onClick={() => setMode(k)}>
          {k === 'near' ? m.modeNear : m.modeJapan}
        </button>
      ))}
    </div>
  );
}

function StatusBar() {
  const m = useT();
  const lang = useStore(prefs, (s) => s.lang);
  const mode = useStore(mapUi, (s) => s.mode);
  const pref = useStore(mapUi, (s) => s.pref);
  const prefFail = useStore(mapUi, (s) => s.prefFail);
  const intro = useStore(prefIntro, (s) => (pref ? s.texts?.[pref]?.[lang] : undefined));
  const tileFail = useStore(mapUi, (s) => s.tileFail);
  const loc = useStore(location, (s) => s.state);
  let main: React.ReactNode = null;
  if (mode === 'japan') {
    main = pref ? (
      <>
        <div className="prefbar">
          <b>{prefName(pref, lang)}</b>
          <button data-pref="" onClick={() => selectPref(null)}>
            {m.prefAll}
          </button>
        </div>
        {intro && (
          <p className="prefintro" lang={lang}>
            {intro}
          </p>
        )}
      </>
    ) : (
      <>
        <p className="mmsg">{m.prefPick}</p>
        {prefFail && <p className="mmsg">{m.prefFail}</p>}
      </>
    );
  } else if (loc === 'ask') {
    main = (
      <div className="notice">
        <b>{m.locAskT}</b>
        <p>{m.locAskB}</p>
        <div className="btns">
          <button className="primary" data-loc="use" onClick={useLocation}>
            {m.locUse}
          </button>
          <button className="secondary" data-loc="skip" onClick={skipLocation}>
            {m.locSkip}
          </button>
        </div>
      </div>
    );
  } else if (loc === 'wait') main = <p className="mmsg">{m.locWait}</p>;
  else if (loc === 'denied') main = <p className="mmsg">{m.locDenied}</p>;
  else if (loc === 'fail')
    main = (
      <p className="mmsg">
        {m.locFail}{' '}
        <button data-loc="use" onClick={useLocation}>
          {m.locRetry}
        </button>
      </p>
    );
  else if (loc === 'skip')
    main = (
      <p className="mmsg">
        {m.locSkipped}{' '}
        <button data-loc="use" onClick={useLocation}>
          {m.locUse}
        </button>
      </p>
    );
  return (
    <div className="mstatus">
      {main}
      {tileFail && <p className="mmsg">{m.tileFail}</p>}
    </div>
  );
}

function CategoryChips() {
  const m = useT();
  const mode = useStore(mapUi, (s) => s.mode);
  const pref = useStore(mapUi, (s) => s.pref);
  const cat = useStore(mapUi, (s) => s.cat);
  if (mode === 'japan' && !pref) return null;
  return (
    <div className="filters" role="group" aria-label={m.aCats}>
      <button className="fchip" aria-pressed={!cat} onClick={() => setCat('')}>
        {m.allCat}
      </button>
      {CATEGORIES.map((c) => (
        <button
          key={c}
          className="fchip"
          data-cat={c}
          aria-pressed={cat === c}
          style={{ '--c': CAT[c].color } as React.CSSProperties}
          onClick={() => setCat(c)}
        >
          <span aria-hidden="true">{CAT[c].icon}</span> {m.cats[c]}
        </button>
      ))}
    </div>
  );
}

/* Keywords, a row of their own under the categories: only those on a place
   now listed (and any already picked), so a pick never empties the list.
   Several picked means a place needs all of them. Hidden while none is. */
function KeywordChips() {
  const lang = useStore(prefs, (s) => s.lang);
  const kw = useStore(mapUi, (s) => s.kw);
  const { list } = useShown();
  const k = KEYWORD_TEXT[lang];
  const shown = KEYWORDS.filter((x) => kw.includes(x) || list.some((p) => p.keywords?.includes(x)));
  if (!shown.length) return null;
  return (
    <div className="filters kwfilters" role="group" aria-label={k.aFilter}>
      {shown.map((x) => (
        <button
          key={x}
          className="fchip"
          data-kw={x}
          aria-pressed={kw.includes(x)}
          onClick={() => setKeyword(x)}
        >
          {k.kw[x]}
        </button>
      ))}
    </div>
  );
}

function Keywords({ of, lang }: { of: Place; lang: keyof typeof KEYWORD_TEXT }) {
  const list = knownKeywords(of.keywords);
  if (!list.length) return null;
  return (
    <span className="kws">
      {list.map((x) => (
        <span key={x} className="kw">
          {KEYWORD_TEXT[lang].kw[x]}
        </span>
      ))}
    </span>
  );
}

function useShown(): { list: Place[]; near: boolean; from: LatLng } {
  const places = useStore(data, (s) => s.places);
  const mode = useStore(mapUi, (s) => s.mode);
  const pref = useStore(mapUi, (s) => s.pref);
  const cat = useStore(mapUi, (s) => s.cat);
  const kw = useStore(mapUi, (s) => s.kw);
  const st = useStore(location, (s) => s.state);
  const loc = useStore(location, (s) => s.loc);
  const from = st === 'ok' && loc ? loc : HOME;
  return { list: shownPlaces(places, { mode, pref, cat, kw }, from), near: mode === 'near', from };
}

function PlaceCard() {
  const m = useT();
  const lang = useStore(prefs, (s) => s.lang);
  const pl = useStore(mapUi, (s) => s.pl);
  const places = useStore(data, (s) => s.places);
  const mine = useStore(session, (s) => (pl != null ? !!s.minePlaces[pl] : false));
  const p = pl == null ? null : places.find((x) => x.id === pl);
  if (!p) return null;
  const day = (d: string) =>
    formatDay(d, LOCALE[lang], { year: 'numeric', month: 'short', day: 'numeric' });
  const url = safeMapsUrl(p.gmaps_url);
  return (
    <div className="pcard">
      <div className="pcat" style={{ color: CAT[p.category].color }}>
        <span aria-hidden="true">{CAT[p.category].icon}</span> {m.cats[p.category]}
      </div>
      <h3 lang={p.lang}>{p.name}</h3>
      <Keywords of={p} lang={lang} />
      {p.description && <Described key={p.id} text={p.description} lang={p.lang} tr={p.tr} />}
      <LangBadge lang={p.lang} />
      <p className="dates">
        {fill(m.addedOn, { d: day(p.created_on) })}
        {p.edited_on && ' · ' + fill(m.editedOn, { d: day(p.edited_on) })}
      </p>
      {url && (
        <a className="glink" href={url} target="_blank" rel="noopener noreferrer">
          {m.openMap}
        </a>
      )}
      {mine && (
        <div className="btns">
          <span className="mine">{m.mine}</span>
          <button className="secondary" onClick={() => go({ name: 'placeEdit', id: p.id })}>
            {m.edit}
          </button>
          <button
            className="secondary"
            onClick={() => void import('../../actions/write').then((w) => w.deletePlace(p.id))}
          >
            {m.del}
          </button>
        </div>
      )}
      {!mine && (
        <button
          className="reportbtn"
          data-report-open="place"
          onClick={() => openReport({ kind: 'place', id: p.id })}
        >
          {m.report}
        </button>
      )}
    </div>
  );
}

function PlaceList() {
  const m = useT();
  const lang = useStore(prefs, (s) => s.lang);
  const mode = useStore(mapUi, (s) => s.mode);
  const pref = useStore(mapUi, (s) => s.pref);
  const cat = useStore(mapUi, (s) => s.cat);
  const kw = useStore(mapUi, (s) => s.kw);
  const places = useStore(data, (s) => s.places);
  const { list, near, from } = useShown();
  const loaded = useStore(data, (s) => !!s.fetchedAt);
  if (!loaded && !places.length) return null;
  if (mode === 'japan' && !pref) {
    const none = !places.length && loaded;
    const groups = new Map<Region, (typeof PREFS)[number][]>();
    for (const p of PREFS) {
      const r = regionOf(p[0]);
      groups.set(r, [...(groups.get(r) ?? []), p]);
    }
    return (
      <>
        {/* adding is only the header button, as in the calendar (owner, 2026-10-25) */}
        {none && <p className="empty slim">{m.emptyPlaces}</p>}
        {(Object.keys(m.regions) as Region[]).map((r) => (
          <div key={r}>
            <div className="sect">{m.regions[r]}</div>
            <div className="preflist">
              {(groups.get(r) ?? []).map(([code]) => {
                const n = places.filter((x) => x.pref === code).length;
                return (
                  <button
                    key={code}
                    data-pref={code}
                    className={n ? 'has' : ''}
                    onClick={() => selectPref(code)}
                  >
                    {prefName(code, lang)}
                    {n > 0 && <small>{fill(m.prefCount, { n })}</small>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </>
    );
  }
  if (!list.length)
    return (
      <p className="empty">
        {!places.length && loaded ? m.emptyPlaces : near ? m.nearEmpty : m.prefEmpty}
      </p>
    );
  /* the key starts again at 8 when the tab, prefecture, category or keywords change */
  return <Rows key={`${mode}|${pref}|${cat}|${kw.join()}`} list={list} from={near ? from : null} />;
}

const PAGE = 8;

/* The first places and a button for the next ones; the pins always show them all. */
function Rows({ list, from }: { list: Place[]; from: LatLng | null }) {
  const m = useT();
  const lang = useStore(prefs, (s) => s.lang);
  const pl = useStore(mapUi, (s) => s.pl);
  const [shown, setShown] = useState(PAGE);
  const left = list.length - shown;
  const dist = (d: number) =>
    d < 1000
      ? fill(m.distM, { n: Math.round(d / 10) * 10 })
      : fill(m.distKm, { n: (d / 1000).toFixed(1) });
  return (
    <>
      <ul className="plist" aria-label={m.aPlaces}>
        {list.slice(0, shown).map((p) => (
          <li key={p.id}>
            <button data-pl={p.id} aria-pressed={pl === p.id} onClick={() => togglePlace(p.id)}>
              <span
                className="dotc"
                style={{ background: CAT[p.category].color }}
                aria-hidden="true"
              >
                {CAT[p.category].icon}
              </span>
              <span className="pmain">
                <b lang={p.lang}>{p.name}</b>
                <Keywords of={p} lang={lang} />
              </span>
              {from && <small className="dist">{dist(distM(from, p))}</small>}
            </button>
          </li>
        ))}
      </ul>
      {left > 0 && (
        <button className="listmore" onClick={() => setShown(shown + PAGE)}>
          {fill(m.listMore, { n: left })}
        </button>
      )}
    </>
  );
}
