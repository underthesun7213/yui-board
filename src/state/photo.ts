import type { PhGrade, PhMode, PhZone } from '../content/photo';
import { createStore } from './store';

/* The fireworks photo (level 8, Kyoto's last scene). The swinging frame lives
   in minigames/photo.ts, outside React; this is what the screen shows around
   it. */
export interface Ph {
  mode: PhMode;
  /** which swing is running: up and down ('v'), then side to side ('h') */
  step: 'v' | 'h';
  /** where each swing was stopped, once it was */
  zv: PhZone | null;
  zh: PhZone | null;
  /** shots taken */
  shots: number;
  /** the last shot: how it came out */
  grade: PhGrade | null;
  /** the scene is over: Next shows */
  done: boolean;
}
export const PH_START: Ph = {
  mode: 'friend',
  step: 'v',
  zv: null,
  zh: null,
  shots: 0,
  grade: null,
  done: false,
};
export const ph = createStore<Ph>(PH_START);
