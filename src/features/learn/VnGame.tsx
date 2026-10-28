import { endingFor, nextScene, pickOption, pickRoute, resetVn } from '../../actions/learn';
import { go } from '../../actions/nav';
import { endingKey, sceneKey } from '../../content/art';
import { plain } from '../../content/ruby';
import type { VnLesson } from '../../content/types';
import { VN } from '../../content/vn';
import { useT } from '../../i18n/useT';
import { prefs } from '../../state/prefs';
import { useStore } from '../../state/useStore';
import { vn } from '../../state/vn';
import { ArtImage } from '../../ui/ArtImage';
import { BackBar } from '../../ui/BackBar';
import { endingVoiceKey, optVoiceKey, sceneVoiceKey } from '../../content/voice-lines';
import { Ruby } from '../../ui/Ruby';
import { Say } from '../../ui/Say';

export function VnGame({ lesson }: { lesson: VnLesson }) {
  const m = useT();
  const lang = useStore(prefs, (s) => s.lang);
  const v = useStore(vn, (s) => s);
  const bar = <BackBar title={`${m.lvL} ${lesson.lv}`} />;
  if (!v.route) {
    return (
      <>
        {bar}
        <div className="lhead">
          <h1>{m.vnPick}</h1>
        </div>
        <div className="routes">
          {(['osaka', 'kyoto'] as const).map((k) => (
            <button key={k} className="route" data-route={k} onClick={() => pickRoute(k)}>
              <b>{VN[k].name[lang]}</b>
              <p>{VN[k].blurb[lang]}</p>
              <span>{m.vnStart} →</span>
            </button>
          ))}
        </div>
      </>
    );
  }
  const R = VN[v.route];
  const sc = R.scenes[v.i];
  if (!sc) {
    const card = endingFor(v.route, v.score);
    return (
      <>
        {bar}
        <div className="vnend">
          <ArtImage k={endingKey(card.id)} alt={plain(card.jp)} className="cgart big" />
          <h1>{card.t[lang]}</h1>
          <q lang="ja">
            <Ruby text={card.jp} />
            <Say k={endingVoiceKey(card.id)} />
          </q>
          <p className="endnote">{card.n[lang]}</p>
          <p className="endscore">
            {m.vnScore} {v.score} / {R.scenes.length}
          </p>
          <div className="btns">
            <button className="primary" onClick={resetVn}>
              {m.vnBack}
            </button>
            <button className="secondary" onClick={() => go({ name: 'collection' })}>
              {m.colT}
            </button>
          </div>
        </div>
      </>
    );
  }
  const picked = v.picked === null ? null : sc.opts[v.picked];
  return (
    <>
      {bar}
      <div className="vnwrap">
        <div className="vndots" aria-hidden="true">
          {R.scenes.map((_, i) => (
            <i key={i} className={i < v.i ? 'past' : i === v.i ? 'now' : ''} />
          ))}
        </div>
        <ArtImage k={sceneKey(v.route, v.i)} alt={plain(sc.jp)} className="cgart" />
        <div className="vnline">
          <b>{R.name[lang]}</b>
          <p lang="ja">
            <Ruby text={sc.jp} />
            <Say k={sceneVoiceKey(v.route, v.i)} />
          </p>
        </div>
        <div className="opts">
          {sc.opts.map((o, i) => (
            <button
              key={i}
              lang="ja"
              data-opt={i}
              className={picked ? 'chosen' + (i === v.picked ? ' me' : '') : ''}
              disabled={!!picked}
              onClick={() => pickOption(i)}
            >
              <Ruby text={o.jp} />
            </button>
          ))}
        </div>
        {picked && (
          <>
            <div className={'fb ' + (picked.ok ? 'ok' : 'hm')} role="status">
              <span aria-hidden="true">{picked.ok ? '○' : '△'}</span>
              <p>{picked.fb[lang]}</p>
              <Say k={optVoiceKey(v.route, v.i, v.picked ?? 0)} />
            </div>
            <button className="primary wide" onClick={nextScene}>
              {m.vnNext}
            </button>
          </>
        )}
      </div>
    </>
  );
}
