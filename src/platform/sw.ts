import { Workbox } from 'workbox-window';

/* Same URL as v1.3 (./sw.js), so an installed v1.3 worker updates in place.
   A new worker waits until the person taps "Reload" on the toast. */
export function registerSW(onWaiting: (activate: () => void) => void) {
  if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return;
  const wb = new Workbox('./sw.js', { scope: './' });
  wb.addEventListener('waiting', () =>
    onWaiting(() => {
      wb.addEventListener('controlling', () => location.reload());
      wb.messageSkipWaiting();
    }),
  );
  wb.register().catch(() => {});
}
