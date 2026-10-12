export const isOnline = () => typeof navigator === 'undefined' || navigator.onLine !== false;

export function onConnectivity(fn: () => void) {
  addEventListener('online', fn);
  addEventListener('offline', fn);
}
export function onVisible(fn: () => void) {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') fn();
  });
}
