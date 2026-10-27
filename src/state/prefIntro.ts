import type { PrefIntro } from '../content/prefIntro';
import { createStore } from './store';

/** Prefecture introductions, once loaded (actions/map.ts ensurePrefIntro). */
export const prefIntro = createStore<{ texts: Record<string, PrefIntro> | null }>({ texts: null });
