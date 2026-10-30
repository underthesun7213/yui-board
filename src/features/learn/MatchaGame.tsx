import { useEffect, useRef } from 'react';
import {
  againArt,
  attachTable,
  detachTable,
  nextStep,
  pickReply,
  scooped,
  toggleSound,
} from '../../actions/matcha';
import {
  MT_COUNT,
  MT_FINISH,
  MT_SCOOPED,
  MT_FB,
  MT_LINES,
  MT_OPTS,
  MT_TEXT,
  MT_TIPS,
  MT_TOOLS,
  type MtLine,
  type MtText,
} from '../../content/matcha';
import { fill } from '../../i18n';
import { useT } from '../../i18n/useT';
import { MT_STAGE, mt, type MtStep } from '../../state/matcha';
import { prefs } from '../../state/prefs';
import { useStore } from '../../state/useStore';
import { Ruby } from '../../ui/Ruby';

const LEAD: Record<MtStep, MtText | null> = {
  intro: 'leadIntro',
  tools: 'leadTools',
  powder: 'leadPowder',
  water: 'leadWater',
  whisk: 'leadWhisk',
  base: 'leadBase',
  art: 'leadArt',
  serve: 'leadServe',
  end: null,
};
/* Next, worded for where it leads */
const NEXT: Record<MtStep, MtText> = {
  intro: 'makeTea',
  tools: 'next',
  powder: 'next',
  water: 'whiskIt',
  whisk: 'herLatte',
  base: 'pourMilk',
  art: 'handIt',
  serve: 'next',
  end: 'next',
};
/* the line Ayano opens each step with */
const OPENING: Partial<Record<MtStep, MtLine>> = {
  powder: 'powder',
  water: 'water',
  whisk: 'whisk',
  base: 'base',
  serve: 'serve',
  end: 'end',
};

const useTx = () => {
  const lang = useStore(prefs, (s) => s.lang);
  return (k: MtText) => MT_TEXT[k][lang];
};

/* 아야노 미니게임 (docs/06-design/minigames/ayano-matcha), scene 4 of
   level 8's Kyoto route: a self-serve matcha set at a tea house. The table is
   a canvas run by minigames/matcha.ts; the step's lines, feedback and
   buttons are below it. A heart in her latte unlocks Ayano's picture; Next
   at the end carries the story on. */
export function MatchaGame({ onDone }: { onDone: () => void }) {
  const m = useT();
  const tx = useTx();
  const lang = useStore(prefs, (s) => s.lang);
  const step = useStore(mt, (s) => s.step);
  const done = useStore(mt, (s) => s.done);
  const muted = useStore(mt, (s) => s.muted);
  const tip = useStore(mt, (s) => s.tip);
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (canvas.current) attachTable(canvas.current);
    return detachTable;
  }, []);
  const stage = MT_STAGE[step];
  const lead = LEAD[step];
  const opening = OPENING[step];
  return (
    <div className="mt">
      <div className="sb-hud">
        <span>
          {stage ? fill(tx('stage'), { n: stage }) : step === 'end' ? tx('done') : tx('title')}
        </span>
        <button type="button" onClick={toggleSound} aria-pressed={muted}>
          {muted ? tx('soundOff') : tx('soundOn')}
        </button>
      </div>
      <div className="mt-stage">
        <canvas ref={canvas} aria-label={tx('table')} />
        {tip && (
          <p className="mt-tip" role="status">
            <span lang="ja">
              <Ruby text={MT_TIPS[tip].jp} />
            </span>
            <small>{MT_TIPS[tip].t[lang]}</small>
          </p>
        )}
      </div>
      {lead && <p className="mt-lead">{tx(lead)}</p>}
      {step === 'intro' && (
        <>
          <Line k="staff" />
          <Line k="ask" />
          <Replies k="intro" />
        </>
      )}
      {step === 'tools' && <Quiz />}
      {opening && <Line k={opening} />}
      {step === 'powder' && <Powder />}
      {(step === 'water' || step === 'whisk' || step === 'base' || step === 'art') && (
        <>
          <Meter />
          <Feedback />
        </>
      )}
      {step === 'art' && <ArtEnd />}
      {step === 'serve' && <Replies k="serve" />}
      {step === 'end' && <End />}
      {done && step !== 'end' && step !== 'art' && (
        <button className="primary wide" data-mt="next" onClick={nextStep}>
          {tx(NEXT[step])}
        </button>
      )}
      {step === 'end' && (
        <button className="primary wide" data-next onClick={onDone}>
          {m.vnNext}
        </button>
      )}
    </div>
  );
}

function Line({ k }: { k: MtLine }) {
  const tx = useTx();
  const lang = useStore(prefs, (s) => s.lang);
  const l = MT_LINES[k];
  return (
    <div className={'vnline mt-line' + (l.who === 'ayano' ? ' ayano' : '')}>
      <b>{tx(l.who)}</b>
      <p lang="ja">
        <Ruby text={l.jp} />
      </p>
      <p className="mt-mean">{l.t[lang]}</p>
    </div>
  );
}

function Replies({ k }: { k: 'intro' | 'serve' }) {
  const tx = useTx();
  const lang = useStore(prefs, (s) => s.lang);
  const picked = useStore(mt, (s) => s.picked);
  const wrong = useStore(mt, (s) => s.wrong);
  const opts = MT_OPTS[k];
  const last = picked ?? wrong[wrong.length - 1];
  const shown = last === undefined ? null : opts[last];
  return (
    <>
      <div className="opts">
        {opts.map((o, i) => (
          <button
            key={i}
            lang="ja"
            data-opt={i}
            className={
              picked === i
                ? 'chosen me'
                : wrong.includes(i)
                  ? 'yk-wrong'
                  : picked !== null
                    ? 'chosen'
                    : ''
            }
            disabled={picked !== null || wrong.includes(i)}
            onClick={() => pickReply(k, i)}
          >
            <Ruby text={o.jp} />
          </button>
        ))}
      </div>
      {shown && (
        <div className={'fb mt-fb ' + (shown.ok ? 'ok' : 'hm')} role="status">
          <p>
            <b>{shown.ok ? '○ ' + tx('nice') : '× ' + tx('retry')}</b>
          </p>
          <p className="mt-say" lang="ja">
            {tx('ayano')}「<Ruby text={shown.reply} />」
          </p>
          <p>{shown.fb[lang]}</p>
        </div>
      )}
    </>
  );
}

function Quiz() {
  const quiz = useStore(mt, (s) => s.quiz);
  return (
    <>
      <Line k={quiz ? 'quiz1' : 'quiz0'} />
      <Feedback />
    </>
  );
}

function Powder() {
  const tx = useTx();
  const scoops = useStore(mt, (s) => s.scoops);
  const done = useStore(mt, (s) => s.done);
  return (
    <>
      <p className="mt-count" lang="ja">
        <Ruby text={MT_COUNT[scoops] ?? MT_COUNT[0]!} />
      </p>
      <Feedback />
      {!done && (
        <button
          type="button"
          className="secondary wide"
          data-mt="scooped"
          disabled={!scoops}
          onClick={scooped}
        >
          <span lang="ja">{MT_SCOOPED}</span> · {tx('scooped')}
        </button>
      )}
    </>
  );
}

function Meter() {
  const tx = useTx();
  const m = useStore(mt, (s) => s.meter);
  if (!m) return null;
  return (
    <div className={'mt-meter' + (m.over ? ' over' : '')}>
      {m.lo !== undefined && m.hi !== undefined && (
        <u style={{ left: `${m.lo * 100}%`, width: `${(m.hi - m.lo) * 100}%` }} />
      )}
      <i style={{ width: `${Math.min(1, m.v) * 100}%` }} />
      <span>{fill(tx(m.k), { n: m.n, a: m.a ?? 0 })}</span>
    </div>
  );
}

/* the explanation of the step, or how it went: blue while it explains, green
   for right, red for a miss, with Ayano's words when she has some */
function Feedback() {
  const tx = useTx();
  const lang = useStore(prefs, (s) => s.lang);
  const f = useStore(mt, (s) => s.fb);
  if (!f) return null;
  const e = MT_FB[f.k];
  const mark = e.head.en[0];
  const cls = mark === '○' ? 'ok' : mark === '×' || mark === '△' ? 'hm' : 'info';
  const vals = {
    n: f.n ?? 0,
    tool: f.tool ? MT_TOOLS[f.tool].name[lang] : '',
    hit: f.hit ? MT_TOOLS[f.hit].name[lang] : '',
    look: f.tool ? (MT_TOOLS[f.tool].look?.[lang] ?? '') : '',
  };
  const say = f.k === 'toolWrong' && f.hit ? `それは${MT_TOOLS[f.hit].ja}どすえ。` : e.say;
  return (
    <div className={'fb mt-fb ' + cls} role="status" data-fb={f.k}>
      <p>
        <b>{fill(e.head[lang], vals)}</b>
      </p>
      {say && (
        <p className="mt-say" lang="ja">
          {tx('ayano')}「<Ruby text={say} />」
        </p>
      )}
      <p>{fill(e.body[lang], vals)}</p>
    </div>
  );
}

/* after the latte art: Next on a heart, once more or serve as it is on a
   miss, her kind line after a second miss */
function ArtEnd() {
  const tx = useTx();
  const s = useStore(mt, (x) => x);
  if (s.retry)
    return (
      <div className="btns">
        <button type="button" className="primary" data-mt="again" onClick={againArt}>
          {tx('again')}
        </button>
        <button type="button" className="secondary" onClick={nextStep}>
          {tx('asIs')}
        </button>
      </div>
    );
  return (
    <>
      {s.last && <Line k="last" />}
      {s.done && (
        <button className="primary wide" data-mt="next" onClick={nextStep}>
          {tx('handIt')}
        </button>
      )}
    </>
  );
}

function End() {
  const tx = useTx();
  const lang = useStore(prefs, (s) => s.lang);
  const got = useStore(mt, (s) => s.got);
  const said = useStore(mt, (s) => s.said);
  return (
    <>
      <p className="mt-title" lang="ja">
        <Ruby text={MT_FINISH} />
      </p>
      <p className={'fb mt-fb ' + (got ? 'ok' : 'info')}>{got ? tx('gotLatte') : tx('noLatte')}</p>
      {said.length > 0 && (
        <div className="mt-phr">
          <b>{tx('phrases')}</b>
          {said.map((x) => (
            <div key={x.jp}>
              <p lang="ja">
                <Ruby text={x.jp} />
              </p>
              <small>{x.t[lang]}</small>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
