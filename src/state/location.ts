import type { LatLng } from '../domain/types';
import { createStore } from './store';

/* ask: never asked · idle: allowed before, not yet located this session ·
   wait · ok · denied · fail · skip. Coordinates stay in memory only (Y-P3). */
export type LocState = 'ask' | 'idle' | 'wait' | 'ok' | 'denied' | 'fail' | 'skip';
export const location = createStore<{ state: LocState; loc: LatLng | null }>({
  state: 'ask',
  loc: null,
});
