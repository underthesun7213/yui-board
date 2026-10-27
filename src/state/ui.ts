import { createStore } from './store';

export interface ReportTarget {
  kind: 'place' | 'event';
  id: number;
}

/** App chrome: the toast, whether a new version is waiting, the report sheet
    (SYS-03) and the full-screen comic page; the last two are sheet state
    rather than routes (system back closes them). */
export const ui = createStore<{
  toast: string;
  toastSeq: number;
  updateReady: boolean;
  report: ReportTarget | null;
  zoom: { lid: string; n: 1 | 2 } | null;
}>({
  toast: '',
  toastSeq: 0,
  updateReady: false,
  report: null,
  zoom: null,
});
