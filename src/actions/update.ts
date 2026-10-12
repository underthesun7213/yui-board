import { registerSW } from '../platform/sw';
import { ui } from '../state/ui';

let activate: (() => void) | null = null;
export function watchForUpdates() {
  registerSW((a) => {
    activate = a;
    ui.set({ updateReady: true });
  });
}
export function activateUpdate() {
  activate?.();
}
