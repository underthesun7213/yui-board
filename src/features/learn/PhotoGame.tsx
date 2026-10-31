import { useEffect, useRef } from 'react';
import { again, attachPhone, detachPhone, stop } from '../../actions/photo';
import {
  PH_FB,
  PH_LAST,
  PH_OPEN,
  PH_TEXT,
  PH_TRIES,
  type PhSay,
  type PhZone,
} from '../../content/photo';
import { fill } from '../../i18n';
import { useT } from '../../i18n/useT';
import { ph } from '../../state/photo';
import { prefs } from '../../state/prefs';
import { useStore } from '../../state/useStore';
import { Ruby } from '../../ui/Ruby';

/* The fireworks photo, the last scene of level 8's Kyoto route: the phone's
   screen is a canvas run by minigames/photo.ts, swinging up and down, then side
   to side, with its gauges on the screen's edges; the stop button (the shutter
   on the second stop), how the shot came out and Ayano's words are below it. A
   good shot of her unlocks her picture; after a good shot or three, Next
   carries the story to the goodbye. */
export function PhotoGame({ onDone }: { onDone: () => void }) {
  const m = useT();
  const lang = useStore(prefs, (s) => s.lang);
  const mode = useStore(ph, (s) => s.mode);
  const step = useStore(ph, (s) => s.step);
  const zv = useStore(ph, (s) => s.zv);
  const zh = useStore(ph, (s) => s.zh);
  const shots = useStore(ph, (s) => s.shots);
  const grade = useStore(ph, (s) => s.grade);
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
  const tag = (label: 'stepV' | 'stepH', z: PhZone | null) =>
    z && (
      <span className={'ph-tag ' + z}>
        {tx(label)} {tx(z)}
      </span>
    );
  return (
    <div className="mt ph">
      <div className="sb-hud">
        <span>
          {done
            ? tx('done')
            : fill(tx('shot'), { n: Math.min(shots + (grade ? 0 : 1), PH_TRIES), all: PH_TRIES })}
        </span>
        {!grade && <span>{tx(step === 'v' ? 'stepV' : 'stepH')}</span>}
      </div>
      <div className={'mt-stage ph-stage ' + mode}>
        <canvas ref={canvas} aria-label={tx('view')} />
      </div>
      {!grade && (
        <>
          {zv && <div className="ph-tags">{tag('stepV', zv)}</div>}
          <button type="button" className="primary wide" data-ph="stop" onClick={stop}>
            {tx(step === 'v' ? 'stop' : 'shutter')}
          </button>
          <p className="mt-lead">{tx(step === 'v' ? 'leadV' : 'leadH')}</p>
          {shots === 0 && step === 'v' && <Line say={PH_OPEN[mode]} />}
        </>
      )}
      {fb && grade && (
        <div
          className={'fb mt-fb ' + (fb.head.en[0] === '○' ? 'ok' : 'hm')}
          role="status"
          data-fb={grade}
        >
          <p>
            <b>{fb.head[lang]}</b>
          </p>
          <div className="ph-tags">
            {tag('stepV', zv)}
            {tag('stepH', zh)}
          </div>
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
