/* registers the lessons' and episode 8's recorded lines with the voice map */
import '../../content/voice';
import { LESSONS } from '../../content/lessons';
import { useT } from '../../i18n/useT';
import { prefs } from '../../state/prefs';
import { useStore } from '../../state/useStore';
import { BackBar } from '../../ui/BackBar';
import { exVoiceKey } from '../../content/voice-lines';
import { Ruby } from '../../ui/Ruby';
import { Say } from '../../ui/Say';
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
      <p className="readorder">
        {/* the panel order as a small 2×2 grid: 2 1 / 4 3 */}
        <span className="rogrid" aria-hidden="true">
          <i>2</i>
          <i>1</i>
          <i>4</i>
          <i>3</i>
        </span>
        {m.readOrder}
      </p>
      <ComicPage lid={l.id} n={1} page={l.pages[0]} />
      <ComicPage lid={l.id} n={2} page={l.pages[1]} />
      <div className="sect">{m.exprT}</div>
      {l.ex.map((e, i) => (
        <div key={i} className="expr">
          <b lang="ja">
            <Ruby text={e.jp} />
          </b>
          <Say k={exVoiceKey(l.id, i)} />
          <span className="rd">{e.rd}</span>
          <p>{e.g[lang]}</p>
        </div>
      ))}
    </>
  );
}
