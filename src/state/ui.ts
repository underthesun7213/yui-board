import { createStore } from './store';

export interface ReportTarget {
  kind: 'place' | 'event';
  id: number;
}

/** App chrome: the toast, whether a new version is waiting, and the report
    sheet (SYS-03), which is sheet state rather than a route. */
export const ui = createStore<{
  toast: string;
  toastSeq: number;
  updateReady: boolean;
  report: ReportTarget | null;
}>({
  toast: '',
  toastSeq: 0,
  updateReady: false,
  report: null,
});
