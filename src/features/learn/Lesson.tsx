import { LESSONS } from '../../content/lessons';
import { useT } from '../../i18n/useT';
import { prefs } from '../../state/prefs';
import { useStore } from '../../state/useStore';
import { BackBar } from '../../ui/BackBar';
import { Ruby } from '../../ui/Ruby';
import { ComicPage } from './ComicPage';
import { LearnList } from './LearnList';
import { VnGame } from './VnGame';

export function Lesson({ lid }: { lid: string }) {
  const m = useT();
  const lang = useStore(prefs, (s) => s.lang);
  const l = LESSONS.find((x) => x.id === lid);
  if (!l) return <LearnList />;
  if (l.vn) return <VnGame lesson={l} />;
  return (
    <>
      <BackBar title={`${m.lvL} ${l.lv}`} />
      <div className="lhead">
        <h1>{l.t[lang]}</h1>
        <p>{l.d[lang]}</p>
      </div>
      <ComicPage lid={l.id} n={1} page={l.pages[0]} />
      <ComicPage lid={l.id} n={2} page={l.pages[1]} />
      <div className="sect">{m.exprT}</div>
      {l.ex.map((e, i) => (
        <div key={i} className="expr">
          <b lang="ja">
            <Ruby text={e.jp} />
          </b>
          <span className="rd">{e.rd}</span>
          <p>{e.g[lang]}</p>
        </div>
      ))}
    </>
  );
}
