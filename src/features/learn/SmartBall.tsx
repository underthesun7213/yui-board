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
import { SB_LINES, SB_TEXT, type SbText } from '../../content/smartball';
import { addVoices } from '../../content/voice-files';
import { sbVoiceKey, sbVoiceLines } from '../../content/voice-lines';
import { fill } from '../../i18n';
import { useT } from '../../i18n/useT';
import { prefs } from '../../state/prefs';
import { sb, sbLimit, sbTotal } from '../../state/smartball';
import { useStore } from '../../state/useStore';
import { Ruby } from '../../ui/Ruby';
import { Say } from '../../ui/Say';

/* Yuki's match lines have their recordings too, once made (gen-voice) */
addVoices(sbVoiceLines(SB_LINES));

type Btn = 'left' | 'launch' | 'right';

/* The smart-ball match, scene 7 of level 8's Osaka route (prototype in
   docs/06-design/minigames/smartball): the table on a canvas run by
   minigames/smartball.ts, an arcade panel of three buttons under it, Yuki's
   lines below. One rematch; win or lose, onDone carries the story on. */
export function SmartBall({
  name,
  win,
  lose,
  winVoice,
  loseVoice,
  onDone,
}: {
  name: string;
  win: string;
  lose: string;
  winVoice: string;
  loseVoice: string;
  onDone: () => void;
}) {
  const m = useT();
  const lang = useStore(prefs, (s) => s.lang);
  const tx = Object.fromEntries(Object.entries(SB_TEXT).map(([k, v]) => [k, v[lang]])) as Record<
    SbText,
    string
  >;
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
      <b>{who === 'me' ? tx.sbYou : name}</b>
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
        aria-label={b === 'left' ? tx.sbLeftA : tx.sbRightA}
        data-flip={b}
        {...hold(
          b,
          () => flip(b, true),
          () => flip(b, false),
        )}
      />
      <span>{b === 'left' ? tx.sbLeft : tx.sbRight}</span>
    </div>
  );

  return (
    <div className="sb">
      <div className="sb-hud">
        <span>
          {s.phase === 'play'
            ? fill(tx.sbBall, {
                n: Math.min(s[s.turn].length + 1, sbLimit(s)),
                k: sbLimit(s),
              }) +
              ' · ' +
              (mine ? tx.sbYourTurn : fill(tx.sbTheirTurn, { name }))
            : tx.sbTitle}
        </span>
        <button type="button" onClick={toggleSound} aria-pressed={s.muted}>
          {s.muted ? tx.sbSoundOff : tx.sbSoundOn}
        </button>
      </div>
      <div className="sb-score">
        {side('me')}
        {side('yuki')}
      </div>
      <div className="sb-stage">
        <canvas ref={canvas} width={300} height={470} aria-label={tx.sbTable} />
        {/* what to do right now, over the table, while it is your ball */}
        {mine && (s.ready || s.flipTip) && (
          <p className={'sb-tip' + (s.ready ? ' launch' : ' flip')} role="status">
            {s.ready ? tx.sbTipLaunch : tx.sbTipFlip}
          </p>
        )}
      </div>

      {s.phase === 'intro' && (
        <>
          {/* how to play, before the first ball */}
          <ol className="sb-guide">
            <li>
              <i className="dot gold" aria-hidden="true" />
              <span>
                <b>{tx.sbG1}</b> {tx.sbG1d}
              </span>
            </li>
            <li>
              <i className="dot red" aria-hidden="true" />
              <span>
                <b>{tx.sbG2}</b> {tx.sbG2d}
              </span>
            </li>
            <li>
              <i className="dot hole" aria-hidden="true" />
              <span>
                <b>{tx.sbG3}</b> {tx.sbG3d}
              </span>
            </li>
          </ol>
          <p className="sb-how">{tx.sbHow}</p>
          <button type="button" className="primary wide" data-sb="start" onClick={startMatch}>
            {s.rematch ? tx.sbStartRe : tx.sbStart}
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
                className={
                  'arc gold' + (held === 'launch' ? ' held' : mine && s.ready ? ' pulse' : '')
                }
                disabled={!mine || !s.ready}
                aria-label={tx.sbLaunchA}
                data-sb="launch"
                {...hold(
                  'launch',
                  () => charge(true),
                  () => charge(false),
                )}
              />
              <span>{tx.sbLaunch}</span>
            </div>
            {flipper('right')}
          </div>
          <p className="sb-how">
            {!mine ? fill(tx.sbTheyPlay, { name }) : s.ready ? tx.sbHintLaunch : tx.sbHintFlip}
          </p>
        </>
      )}

      {s.phase !== 'end' ? (
        <div className="vnline">
          <b>{name}</b>
          <p lang="ja">
            <Ruby text={line.jp} />
            <Say k={sbVoiceKey(s.line)} />
          </p>
          <p className="sb-tr">{line.t[lang]}</p>
        </div>
      ) : (
        <>
          <p className={'fb ' + (won ? 'ok' : 'hm')} role="status">
            <span aria-hidden="true">{won ? '○' : '△'}</span>
            <span className="vnresult">
              {won ? m.vnBallWin : fill(tx.sbTheyWon, { name })}{' '}
              {fill(tx.sbScore, { a: me, b: yu })}
            </span>
          </p>
          <div className="vnline">
            <b>{name}</b>
            <p lang="ja">
              <Ruby text={won ? win : lose} />
              <Say k={won ? winVoice : loseVoice} />
            </p>
          </div>
          <div className="btns">
            {!s.rematch && (
              <button type="button" className="secondary" data-sb="again" onClick={rematch}>
                {tx.sbAgain}
              </button>
            )}
            <button type="button" className="primary" data-next onClick={onDone}>
              {m.vnNext}
            </button>
          </div>
          {s.rematch && <p className="sb-how">{tx.sbFinal}</p>}
        </>
      )}
    </div>
  );
}
