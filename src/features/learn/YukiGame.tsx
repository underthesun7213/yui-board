import { useRef, useState, type RefObject } from 'react';
import { go } from '../../actions/nav';
import {
  addItem,
  biteSkewer,
  dipSkewer,
  eatRest,
  finishEating,
  firstOrdered,
  nextYuki,
  paid,
  pickTalk,
  pickUnit,
  placeOrder,
  restartYuki,
  tapSkewer,
} from '../../actions/yuki';
import { ART } from '../../content/art';
import type { L3 } from '../../content/types';
import type { Lang } from '../../domain/types';
import {
  BUDGET,
  DRINKS,
  END_NOTE,
  KINDS,
  LINES,
  MAX_EACH,
  MENU,
  TALK,
  UNITS,
  WHO,
  YUKI_ART,
  kindsIn,
  orderOk,
  orderTotal,
  yenKana,
  type Line,
  type Look,
} from '../../content/yuki-minigame';
import { fill } from '../../i18n';
import { useT } from '../../i18n/useT';
import { prefs } from '../../state/prefs';
import { useStore } from '../../state/useStore';
import { yuki, type Skewer } from '../../state/yuki';
import { BackBar } from '../../ui/BackBar';
import { Ruby } from '../../ui/Ruby';

const yen = (n: number) => n.toLocaleString('ja-JP') + '円';

/* 유우키 미니게임 (docs/06-design/minigames/yuki-minigame): one picture on
   top, the step's lines and controls below it. No score: answers get feedback,
   a wrong one is tried again. */
export function YukiGame() {
  const m = useT();
  const step = useStore(yuki, (s) => s.step);
  const drink = useStore(yuki, (s) => s.drink);
  const order = useStore(yuki, (s) => s.order);
  const tease = useStore(yuki, (s) => s.tease);
  const sauce = useRef<HTMLButtonElement>(null);
  const pic =
    step === 'start' || step === 'end' ? YUKI_ART.street : tease ? YUKI_ART.tease : YUKI_ART.table;
  const label = step !== 'start' && step !== 'end' ? m.yukiSteps[step] : null;
  return (
    <>
      <BackBar title={m.yukiT} />
      <div className="yk">
        <div className="yk-stage">
          <div className="cgart">
            {/* the street picture is portrait: keep Yuki's face in the 4:3 frame */}
            {ART[pic] ? (
              <img
                src={ART[pic]}
                alt=""
                style={pic === YUKI_ART.street ? { objectPosition: '50% 22%' } : undefined}
              />
            ) : null}
          </div>
          {step === 'eat' && !tease && (
            <button
              ref={sauce}
              type="button"
              className="yk-sauce"
              onClick={() => dipSkewer(yuki.get().sel)}
            >
              <span>{m.yukiSauce}</span>
            </button>
          )}
          <Pops />
        </div>
        {label && (
          <p className="yk-bar">
            <span>{label}</span>
            <span>¥{orderTotal(order, drink).toLocaleString('ja-JP')}</span>
          </p>
        )}
        {step === 'start' && <Start />}
        {(step === 'drink' || step === 'bill' || step === 'leave') && <TalkStep k={step} />}
        {step === 'order' && <Order />}
        {step === 'count' && <Count />}
        {step === 'eat' && <Eat sauce={sauce} />}
        {step === 'pay' && <Pay />}
        {step === 'end' && <End />}
      </div>
    </>
  );
}

function Pops() {
  const pops = useStore(yuki, (s) => s.pops);
  return (
    <div className="yk-pops" aria-hidden="true">
      {pops.map((p) => (
        <span
          key={p.id}
          lang="ja"
          className={'yk-pop' + (p.bad ? ' bad' : '')}
          style={{ left: `${p.x}%`, top: `${p.y}%` }}
        >
          {p.text}
        </span>
      ))}
    </div>
  );
}

function Said({ who, line }: { who: keyof typeof WHO; line: Line }) {
  const lang = useStore(prefs, (s) => s.lang);
  return (
    <div className="vnline yk-line">
      <b>{WHO[who][lang]}</b>
      <p lang="ja">
        <Ruby text={line.jp} />
      </p>
      <p className="yk-mean">{line.mean[lang]}</p>
    </div>
  );
}

function Feedback({ ok, text }: { ok: boolean; text: L3 }) {
  const m = useT();
  const lang = useStore(prefs, (s) => s.lang);
  return (
    <div className={'fb ' + (ok ? 'ok' : 'hm')} role="status">
      <span aria-hidden="true">{ok ? '○' : '×'}</span>
      <p>
        {text[lang]}
        {!ok && <> {m.yukiRetry}</>}
      </p>
    </div>
  );
}

function Start() {
  const m = useT();
  return (
    <div className="yk-panel">
      <p className="yk-mission">
        {fill(m.yukiMission, { k: KINDS, b: BUDGET.toLocaleString('ja-JP') })}
      </p>
      <button className="primary wide" data-yk="start" onClick={nextYuki}>
        {m.yukiGo}
      </button>
    </div>
  );
}

function TalkStep({ k }: { k: keyof typeof TALK }) {
  const m = useT();
  const lang = useStore(prefs, (s) => s.lang);
  const picked = useStore(yuki, (s) => s.picked);
  const wrong = useStore(yuki, (s) => s.wrong);
  const t = TALK[k];
  const last = picked ?? wrong[wrong.length - 1];
  const shown = last === undefined ? null : t.opts[last];
  return (
    <div className="yk-panel">
      {t.who && t.line ? (
        <Said who={t.who} line={t.line} />
      ) : (
        t.lead && <p className="yk-lead">{t.lead[lang]}</p>
      )}
      <div className="opts">
        {t.opts.map((o, i) => (
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
            onClick={() => pickTalk(k, i)}
          >
            <Ruby text={o.jp} />
          </button>
        ))}
      </div>
      {shown && <Feedback ok={shown.ok} text={shown.fb} />}
      {picked !== null && (
        <button className="primary wide" data-yk="next" onClick={nextYuki}>
          {m.vnNext}
        </button>
      )}
    </div>
  );
}

function Order() {
  const m = useT();
  const lang = useStore(prefs, (s) => s.lang);
  const order = useStore(yuki, (s) => s.order);
  const drink = useStore(yuki, (s) => s.drink);
  const sum = orderTotal(order, drink);
  const kinds = kindsIn(order);
  const rows = MENU.filter((x) => (order[x.id] ?? 0) > 0);
  return (
    <div className="yk-panel">
      <Said who="yuki" line={LINES.order} />
      <div className="yk-phone">
        <div className="yk-screen">
          <div className="yk-phbar" lang="ja">
            <span>結屋 モバイルオーダー</span>
            <small>Table 3</small>
          </div>
          <div className="yk-list">
            {MENU.map((x) => {
              const n = order[x.id] ?? 0;
              return (
                <div key={x.id} className={'yk-item' + (n ? ' has' : '')}>
                  <SkewerArt look={x.look} bites={2} dip={false} />
                  <div className="yk-nm">
                    <b lang="ja">
                      <Ruby text={x.ja} />
                    </b>
                    <small>
                      {x.name[lang]} · ¥{x.yen}
                    </small>
                  </div>
                  <div
                    className="yk-qty"
                    role="group"
                    aria-label={fill(m.yukiInCart, { x: x.name[lang], n })}
                  >
                    <button
                      type="button"
                      aria-label={fill(m.yukiLess, { x: x.name[lang] })}
                      disabled={!n}
                      onClick={() => addItem(x.id, -1)}
                    >
                      −
                    </button>
                    <span>{n}</span>
                    <button
                      type="button"
                      className="plus"
                      data-add={x.id}
                      aria-label={fill(m.yukiMore, { x: x.name[lang] })}
                      disabled={n >= MAX_EACH}
                      onClick={() => addItem(x.id, 1)}
                    >
                      ＋
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="yk-foot">
            <div className="yk-meters">
              <span className={kinds >= KINDS ? 'ok' : ''}>
                {m.yukiKinds} {kinds}/{KINDS}
              </span>
              <span className={sum > BUDGET ? 'over' : sum ? 'ok' : ''}>
                ¥{sum.toLocaleString('ja-JP')} / ¥{BUDGET.toLocaleString('ja-JP')}
              </span>
            </div>
            <div className="yk-cart">
              <b>
                <span lang="ja">カート</span> · {m.yukiCart}
              </b>
              {rows.length ? (
                rows.map((x) => (
                  <p key={x.id}>
                    <span lang="ja">
                      <Ruby text={x.ja} /> × {order[x.id]}
                    </span>
                    <span>¥{(x.yen * (order[x.id] ?? 0)).toLocaleString('ja-JP')}</span>
                  </p>
                ))
              ) : (
                <p>{m.yukiEmpty}</p>
              )}
              {drink && (
                <p>
                  <span lang="ja">
                    <Ruby text={DRINKS[drink].ja} /> × 1
                  </span>
                  <span>¥{DRINKS[drink].yen}</span>
                </p>
              )}
              <p className="sum">
                <span lang="ja">合計</span>
                <span>¥{sum.toLocaleString('ja-JP')}</span>
              </p>
            </div>
            <button
              className="primary wide"
              data-yk="order"
              disabled={!orderOk(order, drink)}
              onClick={placeOrder}
            >
              <span lang="ja">注文を確定する</span> · {m.yukiPlace}
            </button>
          </div>
        </div>
      </div>
      <p className="yk-note">{m.yukiReading}</p>
    </div>
  );
}

function Count() {
  const m = useT();
  const lang = useStore(prefs, (s) => s.lang);
  const picked = useStore(yuki, (s) => s.picked);
  const wrong = useStore(yuki, (s) => s.wrong);
  const order = useStore(yuki, (s) => s.order);
  const first = firstOrdered();
  if (!first) return null;
  const n = order[first.id] ?? 0;
  const last = picked ?? wrong[wrong.length - 1];
  const shown = last === undefined ? null : UNITS[last];
  return (
    <div className="yk-panel">
      <div className="vnline yk-line">
        <b>{WHO.me[lang]}</b>
        <p lang="ja">
          <Ruby text={first.ja} />を {n} <span className="yk-blank">？</span>{' '}
          <Ruby text="{頼|たの}んだよ。" />
        </p>
        <p className="yk-mean">{fill(m.yukiBlank, { n, x: first.name[lang] })}</p>
      </div>
      <div className="opts yk-units">
        {UNITS.map((u, i) => (
          <button
            key={u.u}
            lang="ja"
            data-unit={i}
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
            onClick={() => pickUnit(i)}
          >
            {u.u}
          </button>
        ))}
      </div>
      {shown && <Feedback ok={shown.ok} text={shown.fb} />}
      {picked !== null && (
        <>
          <Said who="yuki" line={LINES.reply} />
          <button className="primary wide" data-yk="next" onClick={nextYuki}>
            {m.yukiArrived}
          </button>
        </>
      )}
    </div>
  );
}

function Eat({ sauce }: { sauce: RefObject<HTMLButtonElement | null> }) {
  const m = useT();
  const lang = useStore(prefs, (s) => s.lang);
  const plate = useStore(yuki, (s) => s.plate);
  const sel = useStore(yuki, (s) => s.sel);
  const tease = useStore(yuki, (s) => s.tease);
  const [drag, setDrag] = useState<{
    i: number;
    x0: number;
    y0: number;
    x: number;
    y: number;
    moved: boolean;
  } | null>(null);
  const left = plate.filter((k) => k.bites > 0).length;
  const eaten = plate.length - left;
  const overSauce = (x: number, y: number) => {
    const r = sauce.current?.getBoundingClientRect();
    return !!r && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  };
  return (
    <div className="yk-panel">
      <div className="yk-plate">
        {plate.map((k, i) => (
          <button
            key={i}
            type="button"
            data-k={i}
            className={'yk-kushi' + (i === sel ? ' sel' : '') + (k.bites === 0 ? ' done' : '')}
            disabled={k.bites === 0}
            aria-label={fill(m.yukiSkewer, { x: nameOf(k, lang), s: m.yukiState[stateOf(k)] })}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              setDrag({
                i,
                x0: e.clientX,
                y0: e.clientY,
                x: e.clientX,
                y: e.clientY,
                moved: false,
              });
            }}
            onPointerMove={(e) => {
              if (!drag || drag.i !== i) return;
              const moved =
                drag.moved || Math.abs(e.clientX - drag.x0) + Math.abs(e.clientY - drag.y0) > 8;
              setDrag({ ...drag, x: e.clientX, y: e.clientY, moved });
              sauce.current?.classList.toggle('hot', moved && overSauce(e.clientX, e.clientY));
            }}
            onPointerUp={(e) => {
              if (!drag || drag.i !== i) return;
              sauce.current?.classList.remove('hot');
              if (drag.moved) {
                if (overSauce(e.clientX, e.clientY)) dipSkewer(i);
              } else tapSkewer(i);
              setDrag(null);
            }}
            onPointerCancel={() => setDrag(null)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                biteSkewer(i);
              }
            }}
          >
            <SkewerArt look={lookOf(k)} bites={k.bites} dip={k.dip} />
            <small lang="ja">{MENU.find((x) => x.id === k.id)?.name.ja}</small>
          </button>
        ))}
      </div>
      {drag?.moved && (
        <div className="yk-ghost" style={{ left: drag.x, top: drag.y }} aria-hidden="true">
          <SkewerArt
            look={lookOf(plate[drag.i]!)}
            bites={plate[drag.i]!.bites}
            dip={plate[drag.i]!.dip}
          />
        </div>
      )}
      <div className="acts">
        {left === 0 ? (
          <button className="primary wide" data-yk="ate" onClick={finishEating}>
            {m.yukiAte}
          </button>
        ) : (
          eaten >= 3 && (
            <button className="secondary" data-yk="rest" onClick={eatRest}>
              {fill(m.yukiRest, { n: left })}
            </button>
          )
        )}
      </div>
      {tease ? <Said who="yuki" line={LINES.tease} /> : <Said who="yuki" line={LINES.rule} />}
      {tease ? (
        <p className="fb hm" role="status">
          <span aria-hidden="true">×</span>
          <span className="yk-fbtext">{m.yukiTeased}</span>
        </p>
      ) : (
        <p className="yk-note">{m.yukiRule}</p>
      )}
    </div>
  );
}

function Pay() {
  const m = useT();
  const order = useStore(yuki, (s) => s.order);
  const drink = useStore(yuki, (s) => s.drink);
  const t = orderTotal(order, drink);
  const line: Line = {
    jp: `{全部|ぜんぶ}で${t.toLocaleString('ja-JP')}{円|えん}です。`,
    mean: {
      ja: `全部で${t.toLocaleString('ja-JP')}円です。`,
      en: `That will be ${t.toLocaleString('en-US')} yen altogether.`,
      ko: `전부 해서 ${t.toLocaleString('ko-KR')}엔입니다.`,
    },
  };
  return (
    <div className="yk-panel">
      <Said who="staff" line={line} />
      <p className="yk-read" lang="ja">
        {yen(t)} = {yenKana(t)}
      </p>
      <p className="yk-note">{m.yukiTip}</p>
      <button className="primary wide" data-yk="pay" onClick={paid}>
        {fill(m.yukiPay, { n: yen(t) })}
      </button>
    </div>
  );
}

function End() {
  const m = useT();
  const lang = useStore(prefs, (s) => s.lang);
  const said = useStore(yuki, (s) => s.said);
  const order = useStore(yuki, (s) => s.order);
  const drink = useStore(yuki, (s) => s.drink);
  return (
    <div className="yk-panel">
      <Said who="staff" line={LINES.end} />
      <div className="fb ok">
        <span aria-hidden="true">○</span>
        <p>{END_NOTE[lang]}</p>
      </div>
      <p className="yk-lead">{fill(m.yukiBill, { n: yen(orderTotal(order, drink)) })}</p>
      <div className="yk-said">
        <b>{m.yukiPhrases}</b>
        {said.map((l) => (
          <div key={l.jp}>
            <p lang="ja">
              <Ruby text={l.jp} />
            </p>
            <p className="yk-mean">{l.mean[lang]}</p>
          </div>
        ))}
      </div>
      <div className="btns">
        <button className="primary" data-yk="again" onClick={restartYuki}>
          {m.yukiAgain}
        </button>
        <button className="secondary" onClick={() => go({ name: 'learn' })}>
          {m.yukiList}
        </button>
      </div>
    </div>
  );
}

const lookOf = (k: Skewer): Look => MENU.find((x) => x.id === k.id)?.look ?? 'meat';
const nameOf = (k: Skewer, lang: Lang) => MENU.find((x) => x.id === k.id)?.name[lang] ?? k.id;
const stateOf = (k: Skewer) =>
  k.bites === 0 ? 'eaten' : k.bites === 2 ? (k.dip ? 'dipped' : 'plain') : 'bitten';

/* a skewer drawn from simple shapes: two pieces, one after a bite */
function SkewerArt({ look, bites, dip }: { look: Look; bites: number; dip: boolean }) {
  const fill = dip ? 'url(#yk-sauced)' : 'url(#yk-batter)';
  const stroke = { stroke: '#5a3a28', strokeWidth: 2, strokeLinejoin: 'round' as const };
  const piece = (i: number) => {
    const y = 8 + i * 24;
    if (look === 'egg')
      return <circle key={i} cx="20" cy={y + 10} r="10" fill={fill} {...stroke} />;
    if (look === 'ring')
      return (
        <g key={i}>
          <ellipse cx="20" cy={y + 10} rx="15" ry="10" fill={fill} {...stroke} />
          <ellipse
            cx="20"
            cy={y + 10}
            rx="5"
            ry="3.5"
            fill="#8a5a2c"
            stroke="#5a3a28"
            strokeWidth="1.5"
          />
        </g>
      );
    if (look === 'long')
      return <rect key={i} x="9" y={y} width="22" height="22" rx="10" fill={fill} {...stroke} />;
    if (look === 'block')
      return <rect key={i} x="8" y={y + 1} width="24" height="19" rx="5" fill={fill} {...stroke} />;
    return <rect key={i} x="6" y={y} width="28" height="21" rx="8" fill={fill} {...stroke} />;
  };
  const parts = bites >= 2 ? [0, 1] : bites === 1 ? [1] : [];
  return (
    <svg width="40" height="70" viewBox="0 0 40 70" aria-hidden="true">
      <defs>
        <radialGradient id="yk-batter" cx="40%" cy="35%" r="70%">
          <stop offset="0" stopColor="#f7d58e" />
          <stop offset=".65" stopColor="#e0a548" />
          <stop offset="1" stopColor="#b07428" />
        </radialGradient>
        <radialGradient id="yk-sauced" cx="40%" cy="35%" r="70%">
          <stop offset="0" stopColor="#a8683a" />
          <stop offset=".65" stopColor="#734020" />
          <stop offset="1" stopColor="#52290f" />
        </radialGradient>
      </defs>
      <rect
        x="18.5"
        y="2"
        width="3"
        height="66"
        rx="1.5"
        fill="#e6caa0"
        stroke="#5a3a28"
        strokeWidth="1.2"
      />
      {parts.map(piece)}
    </svg>
  );
}
