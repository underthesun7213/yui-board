import { createStore } from './store';

/** App chrome: the toast and whether a new version is waiting. */
export const ui = createStore<{ toast: string; toastSeq: number; updateReady: boolean }>({
  toast: '',
  toastSeq: 0,
  updateReady: false,
});
