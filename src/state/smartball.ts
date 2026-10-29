import type { SbLine } from '../content/smartball';
import { createStore } from './store';

/* The smart-ball match (level 8, Osaka scene 7). The table itself — the marble,
   flippers and physics — lives in minigames/smartball.ts, outside React; this
   is what the screen shows around it. */
export interface Sb {
  phase: 'intro' | 'play' | 'end';
  turn: 'me' | 'yuki';
  /** points of each ball played, per player */
  me: number[];
  yuki: number[];
  /** extra balls each after a tie */
  extra: number;
  /** points of the ball in play */
  cur: number;
  /** the ball waits on the plunger */
  ready: boolean;
  /** the one rematch has been taken */
  rematch: boolean;
  /** Yuki's latest line, and a counter so the same line twice still shows */
  line: SbLine;
  seq: number;
  muted: boolean;
  /** the first ball is up: the paddle tip shows until a flip or a few seconds */
  flipTip: boolean;
}
export const SB_START: Sb = {
  phase: 'intro',
  turn: 'me',
  me: [],
  yuki: [],
  extra: 0,
  cur: 0,
  ready: false,
  rematch: false,
  line: 'intro',
  seq: 0,
  muted: false,
  flipTip: false,
};
export const sb = createStore<Sb>(SB_START);

export const SB_BALLS = 3;
export const sbLimit = (s: Sb) => SB_BALLS + s.extra;
export const sbTotal = (s: Sb, who: 'me' | 'yuki') =>
  s[who].reduce((a, b) => a + b, 0) + (s.phase === 'play' && s.turn === who ? s.cur : 0);
