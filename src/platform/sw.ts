import { Workbox } from 'workbox-window';

/* ./sw.js, scope ./ (ADR-0020 4; the address itself moved in ADR-0025).
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
