import { createStore } from './store';

/** English for the lines of episode 8, once loaded (actions/learn.ts ensureVnEn). */
export const vnEn = createStore<{ texts: Record<string, string> | null }>({ texts: null });
