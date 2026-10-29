import type { Bet, Route } from '../content/types';
import { createStore } from './store';

export interface Vn {
  route: Route | null;
  i: number;
  picked: number | null;
  score: number;
  /** smartball: how the match went */
  ball: 'win' | 'lose' | null;
  /** what the smart-ball match is played for, from the reply before it */
  bet: Bet | null;
  /** an achievement unlocked in this scene, shown until the next one */
  got: string | null;
}
export const VN_START: Vn = {
  route: null,
  i: 0,
  picked: null,
  score: 0,
  ball: null,
  bet: null,
  got: null,
};
export const vn = createStore<Vn>(VN_START);
