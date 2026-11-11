import type { Lang } from '../domain/types';
import { createStore } from './store';

export const prefs = createStore<{ lang: Lang }>({ lang: 'en' });
