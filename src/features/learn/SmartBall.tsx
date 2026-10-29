import { useEffect, useRef, useState } from 'react';
import {
  attachTable,
  charge,
  detachTable,
  flip,
  rematch,
  resetMatch,
  startMatch,
  toggleSound,
} from '../../actions/smartball';
import { SB_LINES } from '../../content/smartball';
import { fill } from '../../i18n';
import { useT } from '../../i18n/useT';
import { prefs } from '../../state/prefs';
import { sb, sbLimit, sbTotal } from '../../state/smartball';
import { useStore } from '../../state/useStore';
import { Ruby } from '../../ui/Ruby';

type Btn = 'left' | 'launch' | 'right';

/* The smart-ball match, scene 7 of level 8's Osaka route (prototype in
   docs/06-design/minigames/smartball): the table on a canvas run by
   minigames/smartball.ts, an arcade panel of three buttons under it, Yuki's
   lines below. One rematch; win or lose, onDone carries the story on. */
export function SmartBall({
  name,
  win,
  lose,
  onDone,
}: {
  name: string;
  win: string;
  lose: string;
  onDone: () => void;
}) {
  const m = useT();
  const lang = useStore(prefs, (s) => s.lang);
  const s = useStore(sb, (x) => x);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [held, setHeld] = useState<Btn | null>(null);
  useEffect(() => {
    resetMatch();
    if (canvas.current) attachTable(canvas.current);
    return detachTable;
  }, []);

  const mine = s.phase === 'play' && s.turn === 'me';
  const me = sbTotal(s, 'me');
  const yu = sbTotal(s, 'yuki');
  const won = me > yu;
  const line = SB_LINES[s.line];
  const hold = (b: Btn, on: () => void, off: () => void) => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      setHeld(b);
      on();
    },
    onPointerUp: () => {
      setHeld(null);
      off();
    },
    onPointerCancel: () => {
      setHeld(null);
      off();
    },
    onPointerLeave: () => {
      if (held === b) {
        setHeld(null);
        off();
      }
    },
  });
  const side = (who: 'me' | 'yuki') => (
    <div className={'sb-side' + (s.phase === 'play' && s.turn === who ? ' now' : '')}>
      <b>{who === 'me' ? m.sbYou : name}</b>
      <span className="sb-pts">{who === 'me' ? me : yu}</span>
      <span className="sb-pips" aria-hidden="true">
        {Array.from({ length: sbLimit(s) }, (_, i) => (
          <i key={i} className={i < s[who].length ? 'used' : ''} />
        ))}
      </span>
    </div>
  );
  const flipper = (b: 'left' | 'right') => (
    <div className="sb-slot">
      <button
        type="button"
        className={'arc' + (held === b ? ' held' : '')}
        disabled={!mine || s.ready}
        aria-label={b === 'left' ? m.sbLeftA : m.sbRightA}
        data-flip={b}
        {...hold(
          b,
          () => flip(b, true),
          () => flip(b, false),
        )}
      />
      <span>{b === 'left' ? m.sbLeft : m.sbRight}</span>
    </div>
  );

  return (
    <div className="sb">
      <div className="sb-hud">
        <span>
          {s.phase === 'play'
            ? fill(m.sbBall, {
                n: Math.min(s[s.turn].length + 1, sbLimit(s)),
                k: sbLimit(s),
              }) +
              ' · ' +
              (mine ? m.sbYourTurn : fill(m.sbTheirTurn, { name }))
            : m.sbTitle}
        </span>
        <button type="button" onClick={toggleSound} aria-pressed={s.muted}>
          {s.muted ? m.sbSoundOff : m.sbSoundOn}
        </button>
      </div>
      <div className="sb-score">
        {side('me')}
        {side('yuki')}
      </div>
      <div className="sb-stage">
        <canvas ref={canvas} width={300} height={470} aria-label={m.sbTable} />
      </div>

      {s.phase === 'intro' && (
        <>
          <p className="sb-how">{m.sbHow}</p>
          <button type="button" className="primary wide" data-sb="start" onClick={startMatch}>
            {s.rematch ? m.sbStartRe : m.sbStart}
          </button>
        </>
      )}
      {s.phase === 'play' && (
        <>
          <div className="sb-deck">
            {flipper('left')}
            <div className="sb-slot">
              <button
                type="button"
                className={'arc gold' + (held === 'launch' ? ' held' : '')}
                disabled={!mine || !s.ready}
                aria-label={m.sbLaunchA}
                data-sb="launch"
                {...hold(
                  'launch',
                  () => charge(true),
                  () => charge(false),
                )}
              />
              <span>{m.sbLaunch}</span>
            </div>
            {flipper('right')}
          </div>
          <p className="sb-how">
            {!mine ? fill(m.sbTheyPlay, { name }) : s.ready ? m.sbHintLaunch : m.sbHintFlip}
          </p>
        </>
      )}

      {s.phase !== 'end' ? (
        <div className="vnline">
          <b>{name}</b>
          <p lang="ja">
            <Ruby text={line.jp} />
          </p>
          <p className="sb-tr">{line.t[lang]}</p>
        </div>
      ) : (
        <>
          <p className={'fb ' + (won ? 'ok' : 'hm')} role="status">
            <span aria-hidden="true">{won ? '○' : '△'}</span>
            <span className="vnresult">
              {won ? m.vnBallWin : fill(m.sbTheyWon, { name })} {fill(m.sbScore, { a: me, b: yu })}
            </span>
          </p>
          <div className="vnline">
            <b>{name}</b>
            <p lang="ja">
              <Ruby text={won ? win : lose} />
            </p>
          </div>
          <div className="btns">
            {!s.rematch && (
              <button type="button" className="secondary" data-sb="again" onClick={rematch}>
                {m.sbAgain}
              </button>
            )}
            <button type="button" className="primary" data-next onClick={onDone}>
              {m.vnNext}
            </button>
          </div>
          {s.rematch && <p className="sb-how">{m.sbFinal}</p>}
        </>
      )}
    </div>
  );
}
