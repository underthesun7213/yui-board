import { useEffect, useRef } from 'react';
import { again, attachPhone, detachPhone, shoot, zoomTo } from '../../actions/photo';
import { PH_FB, PH_LAST, PH_OPEN, PH_TEXT, PH_TRIES, type PhSay } from '../../content/photo';
import { fill } from '../../i18n';
import { useT } from '../../i18n/useT';
import { PH_ZOOM } from '../../minigames/photo-geo';
import { ph } from '../../state/photo';
import { prefs } from '../../state/prefs';
import { useStore } from '../../state/useStore';
import { Ruby } from '../../ui/Ruby';

/* The fireworks photo, the last scene of level 8's Kyoto route: the phone's
   screen is a canvas run by minigames/photo.ts; the zoom, the shutter, how the
   shot came out and Ayano's words are below it. A good shot of her unlocks her
   picture; after a good shot or three, Next carries the story to the goodbye. */
export function PhotoGame({ onDone }: { onDone: () => void }) {
  const m = useT();
  const lang = useStore(prefs, (s) => s.lang);
  const mode = useStore(ph, (s) => s.mode);
  const zoom = useStore(ph, (s) => s.zoom);
  const shots = useStore(ph, (s) => s.shots);
  const grade = useStore(ph, (s) => s.grade);
  const n = useStore(ph, (s) => s.n);
  const done = useStore(ph, (s) => s.done);
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (canvas.current) attachPhone(canvas.current);
    return detachPhone;
  }, []);
  const tx = (k: keyof typeof PH_TEXT) => PH_TEXT[k][lang];
  const fb = grade ? PH_FB[grade] : null;
  const missedAll =
    done && grade !== null && grade !== 'best' && grade !== 'good' && grade !== 'skyGood';
  return (
    <div className="mt ph">
      <div className="sb-hud">
        <span>
          {done
            ? tx('done')
            : fill(tx('shot'), { n: Math.min(shots + 1, PH_TRIES), all: PH_TRIES })}
        </span>
      </div>
      <div className="mt-stage ph-stage">
        <canvas ref={canvas} aria-label={tx('view')} />
      </div>
      {!grade && (
        <>
          <label className="ph-zoom">
            <span>{tx('zoom')}</span>
            <input
              type="range"
              min={PH_ZOOM[0]}
              max={PH_ZOOM[1]}
              step={0.05}
              value={zoom}
              onChange={(e) => zoomTo(Number(e.target.value))}
            />
          </label>
          <button type="button" className="primary wide" data-ph="shoot" onClick={shoot}>
            {tx('shutter')}
          </button>
          <p className="mt-lead">{tx(mode === 'sky' ? 'leadSky' : 'leadFriend')}</p>
          {shots === 0 && <Line say={PH_OPEN[mode]} />}
        </>
      )}
      {fb && grade && (
        <div
          className={'fb mt-fb ' + (fb.head.en[0] === '○' ? 'ok' : 'hm')}
          role="status"
          data-fb={grade}
        >
          <p>
            <b>{fill(fb.head[lang], { n })}</b>
          </p>
          <p className="mt-say" lang="ja">
            {tx('ayano')}「<Ruby text={fb.say} />」
          </p>
          <p>{fb.body[lang]}</p>
        </div>
      )}
      {missedAll && mode === 'friend' && <Line say={PH_LAST} />}
      {grade && !done && (
        <button type="button" className="primary wide" data-ph="again" onClick={again}>
          {tx('again')}
        </button>
      )}
      {done && (
        <button className="primary wide" data-next onClick={onDone}>
          {m.vnNext}
        </button>
      )}
    </div>
  );
}

function Line({ say }: { say: PhSay }) {
  const lang = useStore(prefs, (s) => s.lang);
  return (
    <div className="vnline mt-line ayano">
      <b>{PH_TEXT.ayano[lang]}</b>
      <p lang="ja">
        <Ruby text={say.jp} />
      </p>
      <p className="mt-mean">{say.t[lang]}</p>
    </div>
  );
}
