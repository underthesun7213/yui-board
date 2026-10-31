import type { PhGrade, PhMode } from '../content/photo';
import { createStore } from './store';

/* The fireworks photo (level 8, Kyoto's last scene). The frame over the
   picture lives in minigames/photo.ts, outside React; this is what the screen
   shows around it. */
export interface Ph {
  mode: PhMode;
  /** the frame's zoom, from PH_ZOOM[0] to PH_ZOOM[1] */
  zoom: number;
  /** shots taken */
  shots: number;
  /** the last shot: how it came out, and the fireworks in it */
  grade: PhGrade | null;
  n: number;
  /** the scene is over: Next shows */
  done: boolean;
}
export const PH_START: Ph = {
  mode: 'friend',
  zoom: 3,
  shots: 0,
  grade: null,
  n: 0,
  done: false,
};
export const ph = createStore<Ph>(PH_START);
