import type { Route } from '../content/types';
import { createStore } from './store';

export interface Vn {
  route: Route | null;
  i: number;
  picked: number | null;
  score: number;
  /** smartball: how the match went */
  ball: 'win' | 'lose' | null;
}
export const VN_START: Vn = { route: null, i: 0, picked: null, score: 0, ball: null };
export const vn = createStore<Vn>(VN_START);
