/* 아야노 미니게임: the screen's way to the table runtime, and the replies. */
import { ACH_LATTE } from '../content/achievements';
import { MT_OPTS } from '../content/matcha';
import * as table from '../minigames/matcha';
import { mt } from '../state/matcha';
import { unlock } from './achievements';

/** the canvas is on screen: run the table there; a heart unlocks Ayano's picture */
export const attachTable = (canvas: HTMLCanvasElement) =>
  table.attach(canvas, () => unlock(ACH_LATTE));
export const detachTable = table.detach;
export const nextStep = table.next;
export const scooped = table.scooped;
export const againArt = table.againArt;
export const toggleSound = table.toggleMute;

/* A reply in the intro or at the serve: a right one ends the step and is
   kept for the list at the end; a wrong one is marked and another tried. */
export function pickReply(k: 'intro' | 'serve', i: number) {
  const s = mt.get();
  const o = MT_OPTS[k][i];
  if (!o || s.picked !== null || s.wrong.includes(i)) return;
  if (!o.ok) {
    mt.set({ wrong: [...s.wrong, i] });
    return;
  }
  mt.set({
    picked: i,
    done: true,
    said: s.said.some((x) => x.jp === o.jp) ? s.said : [...s.said, { jp: o.jp, t: o.t }],
  });
}
