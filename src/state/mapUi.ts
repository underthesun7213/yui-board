import type { Keyword } from '../domain/keywords';
import type { Category } from '../domain/types';
import { createStore } from './store';

export interface MapUi {
  mode: 'near' | 'japan';
  pref: string | null;
  cat: Category | '';
  /** keywords picked in the filter row: a place needs all of them */
  kw: readonly Keyword[];
  /** selected place id */
  pl: number | null;
  prefFail: boolean;
  /** prefecture boundaries loaded */
  prefReady: boolean;
  tileFail: boolean;
  mapFail: boolean;
  /** bumped to ask the map to fit its contents */
  fitSeq: number;
  /** the place form is open: a tap on the map sets `pick` */
  picking: boolean;
  pick: { lat: number; lng: number } | null;
  /** bumped when the pin is put somewhere off screen (a pasted link): the map goes to it */
  pickSeq: number;
}
export const mapUi = createStore<MapUi>({
  mode: 'near',
  pref: null,
  cat: '',
  kw: [],
  pl: null,
  prefFail: false,
  prefReady: false,
  tileFail: false,
  mapFail: false,
  fitSeq: 0,
  picking: false,
  pick: null,
  pickSeq: 0,
});
