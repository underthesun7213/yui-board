import { createStore } from './store';

/** Ending cards collected on this device, by ending id (yui.v1.cg). */
export const collection = createStore<{ cg: Record<string, true> }>({ cg: {} });
