import { openLesson } from '../../actions/learn';
import { go } from '../../actions/nav';
import { ENDINGS } from '../../content/endings';
import { LESSONS } from '../../content/lessons';
import { useT } from '../../i18n/useT';
import { collection } from '../../state/collection';
import { prefs } from '../../state/prefs';
import { useStore } from '../../state/useStore';

export function LearnList() {
  const m = useT();
  const lang = useStore(prefs, (s) => s.lang);
  const cg = useStore(collection, (s) => s.cg);
  const got = ENDINGS.filter((e) => cg[e.id]).length;
  return (
    <>
      <div className="pagehead">
        <h1>{m.learnT}</h1>
        <p>{m.learnS}</p>
      </div>
      {LESSONS.map((l) => (
        <button key={l.id} className="lesson" data-lesson={l.id} onClick={() => openLesson(l.id)}>
          <span className={'lvbadge' + (l.vn ? ' vn' : '')} aria-hidden="true">
            {l.vn ? '▶' : l.lv}
          </span>
          <span className="lmain">
            <b>{l.t[lang]}</b>
            <em>{l.d[lang]}</em>
          </span>
          <span className="lcuts">{l.vn ? '' : l.cuts.length}</span>
        </button>
      ))}
      <div className="sect">{m.colT}</div>
      <button className="colrow" onClick={() => go({ name: 'collection' })}>
        <span className="colthumbs" aria-hidden="true">
          {ENDINGS.map((e) => (
            <i key={e.id} className={cg[e.id] ? 'on' : ''} />
          ))}
        </span>
        <span className="colmain">
          <b>{m.colOpen}</b>
          <em>
            {got} / {ENDINGS.length}
          </em>
        </span>
      </button>
    </>
  );
}
