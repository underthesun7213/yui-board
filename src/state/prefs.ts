import type { Lang } from '../domain/types';
import { createStore } from './store';

/** lang: screen language; stats: usage statistics on (D40) */
export const prefs = createStore<{ lang: Lang; stats: boolean }>({ lang: 'en', stats: true });
