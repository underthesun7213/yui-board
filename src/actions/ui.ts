import { ui } from '../state/ui';

let timer: ReturnType<typeof setTimeout> | undefined;
export function toast(msg: string) {
  ui.set((s) => ({ toast: msg, toastSeq: s.toastSeq + 1 }));
  clearTimeout(timer);
  timer = setTimeout(() => ui.set({ toast: '' }), 1700);
}
