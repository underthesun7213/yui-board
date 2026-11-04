/* "Install app" on the home screen. Chrome and Edge fire beforeinstallprompt,
   which is kept and replayed on the tap; Safari on iPhone and iPad has no such
   event, so there the home screen shows the Share → Add to Home Screen steps.
   Nothing is offered once the app runs installed. */
type Deferred = Event & { prompt(): Promise<unknown> };
let deferred: Deferred | null = null;

/** 'prompt': the browser installs on a tap; 'ios': show the steps; 'no': installed or not offered */
export type Install = 'no' | 'prompt' | 'ios';

export function watchInstall(set: (s: Install) => void) {
  const nav = navigator as Navigator & { standalone?: boolean };
  if (matchMedia('(display-mode: standalone)').matches || nav.standalone) return;
  const ua = navigator.userAgent;
  if (/iP(hone|ad|od)/.test(ua) || (/Mac/.test(ua) && navigator.maxTouchPoints > 1)) set('ios');
  addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e as Deferred;
    set('prompt');
  });
  addEventListener('appinstalled', () => set('no'));
}

/** the browser's own install dialog; it can be shown once per event */
export async function promptInstall(set: (s: Install) => void) {
  const d = deferred;
  deferred = null;
  set('no');
  await d?.prompt();
}
