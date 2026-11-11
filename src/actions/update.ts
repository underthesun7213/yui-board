import type { Props } from '../platform/analytics';
import { promptInstall, watchInstall, type Install } from '../platform/install';
import { registerSW } from '../platform/sw';
import { ui } from '../state/ui';

/* The app's life on this device: installing, updating, and sending usage
   statistics (D40). track() lives here, not in a module of its own: every
   module the first screen shares with a later screen becomes a file of its
   own, and the first screen's budget pays for each. The sending code is a
   chunk loaded on the first event; the switch is actions/stats.ts. Five
   events, nothing else. */
export type StatEvent = 'app_open' | 'install_tap' | 'install_done' | 'game_start' | 'game_finish';
const statsCode = () => import('../platform/analytics');
const ignore = () => {};

export const track = (event: StatEvent, props?: Props) =>
  void statsCode().then((a) => a.send(event, props), ignore);

const setInstall = (install: Install) => ui.set({ install });
export const watchInstallable = () => watchInstall(setInstall, () => track('install_done'));
/** install_tap carries the kind: 'prompt' is the browser's own dialog, the rest open the steps */
export const installHelp = () => track('install_tap', { kind: ui.get().install });
export function installApp() {
  installHelp();
  return promptInstall(setInstall);
}

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
