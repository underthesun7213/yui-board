import type { Category } from '../domain/types';
import { createStore } from './store';

export interface MapUi {
  mode: 'near' | 'japan';
  pref: string | null;
  cat: Category | '';
  /** selected place id */
  pl: number | null;
  prefFail: boolean;
  /** prefecture boundaries loaded */
  prefReady: boolean;
  tileFail: boolean;
  mapFail: boolean;
  /** bumped to ask the map to fit its contents */
  fitSeq: number;
}
export const mapUi = createStore<MapUi>({
  mode: 'near',
  pref: null,
  cat: '',
  pl: null,
  prefFail: false,
  prefReady: false,
  tileFail: false,
  mapFail: false,
  fitSeq: 0,
});
