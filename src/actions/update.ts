import { promptInstall, watchInstall, type Install } from '../platform/install';
import { registerSW } from '../platform/sw';
import { ui } from '../state/ui';

const setInstall = (install: Install) => ui.set({ install });
export const watchInstallable = () => watchInstall(setInstall);
export const installApp = () => promptInstall(setInstall);

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
