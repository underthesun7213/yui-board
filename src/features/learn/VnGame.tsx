import { endingFor, nextScene, pickOption, pickRoute, resetVn } from '../../actions/learn';
import { go } from '../../actions/nav';
import { SmartBall, YukiGame } from '../../app/screens';
import { ACHIEVEMENTS } from '../../content/achievements';
import { achievementKey, endingKey, sceneKey } from '../../content/art';
import { plain } from '../../content/ruby';
import type { VnLesson, VnSay } from '../../content/types';
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
            {m.vnScore} {v.score} / {R.scenes.filter((s) => s.opts.length).length}
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
  const kind = sc.kind ?? 'talk';
  const got = v.got ? ACHIEVEMENTS.find((a) => a.id === v.got) : undefined;
  const picked = v.picked === null ? null : sc.opts[v.picked];
  /* a line, by the route's friend or by the shop staff */
  const say = (l: VnSay, key: string, voice?: string) => (
    <div className="vnline" key={key}>
      <b>{l.who === 'staff' ? m.vnStaff : R.name[lang]}</b>
      <p lang="ja">
        <Ruby text={l.jp} />
        {voice && <Say k={voice} />}
      </p>
    </div>
  );
  const next = (
    <button className="primary wide" data-next onClick={nextScene}>
      {m.vnNext}
    </button>
  );
  return (
    <>
      {bar}
      <div className="vnwrap">
        <div className="vndots" aria-hidden="true">
          {R.scenes.map((_, i) => (
            <i key={i} className={i < v.i ? 'past' : i === v.i ? 'now' : ''} />
          ))}
        </div>
        {kind === 'yuki' ? (
          <>
            {sc.note && <p className="vnnote">{sc.note[lang]}</p>}
            {/* the 유우키 미니게임 brings its own pictures; Next ends it */}
            <YukiGame onDone={nextScene} />
          </>
        ) : kind === 'smartball' ? null : (
          <>
            <ArtImage k={sceneKey(v.route, v.i)} alt={plain(sc.jp || sc.s)} className="cgart" />
            {sc.note && <p className="vnnote">{sc.note[lang]}</p>}
            {sc.jp && say({ who: 'friend', jp: sc.jp }, 'jp', sceneVoiceKey(v.route, v.i))}
            {sc.more?.map((l, i) => say(l, 'more' + i))}
            {kind === 'talk' && (
              <>
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
                    {picked.reply?.map((l, i) => say(l, 'reply' + i))}
                    <div className={'fb ' + (picked.ok ? 'ok' : 'hm')} role="status">
                      <span aria-hidden="true">{picked.ok ? '○' : '△'}</span>
                      <p>{picked.fb[lang]}</p>
                      <Say k={optVoiceKey(v.route, v.i, v.picked ?? 0)} />
                    </div>
                    {next}
                  </>
                )}
              </>
            )}
            {kind === 'move' && next}
          </>
        )}
        {kind === 'smartball' && (
          <>
            {sc.note && <p className="vnnote">{sc.note[lang]}</p>}
            {/* the smart-ball table; its end shows Yuki's win or lose line and Next */}
            <SmartBall
              name={R.name[lang]}
              win={sc.win ?? ''}
              lose={sc.lose ?? ''}
              onDone={nextScene}
            />
          </>
        )}
        {got && (
          <div className="achcard" role="status" data-ach={got.id}>
            <ArtImage k={achievementKey(got.id)} alt={plain(got.jp)} className="cgart" />
            <small>{m.achGot}</small>
            <b>{got.t[lang]}</b>
            <q lang="ja">
              <Ruby text={got.jp} />
            </q>
          </div>
        )}
      </div>
    </>
  );
}
