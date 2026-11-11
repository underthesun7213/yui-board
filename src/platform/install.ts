/* "Install app". Chrome and Edge fire beforeinstallprompt, which is kept and
   replayed on the tap. Everything else gets words: Safari on iPhone and iPad
   has no such event; Android browsers may not fire it; an app's own browser
   (LINE, Instagram) cannot install at all. Samsung Internet's generated app is
   blocked by Play Protect (owner, 2026-11-06), so it is sent to Chrome.
   Nothing is offered once the app runs installed. */
type Deferred = Event & { prompt(): Promise<unknown> };
let deferred: Deferred | null = null;

/** 'prompt': the browser installs on a tap; 'no': installed or not offered; the rest show words */
export type Install = 'no' | 'prompt' | 'ios' | 'android' | 'samsung' | 'line' | 'inapp';

export function installKind(ua: string, touchPoints: number): Install {
  if (/\bLine\//i.test(ua)) return 'line';
  if (/Instagram|FBAN|FBAV|FB_IAB|KAKAOTALK/i.test(ua)) return 'inapp';
  if (/iP(hone|ad|od)/.test(ua) || (/Mac/.test(ua) && touchPoints > 1)) return 'ios';
  if (/SamsungBrowser/.test(ua)) return 'samsung';
  return /Android/.test(ua) ? 'android' : 'no';
}

export function watchInstall(set: (s: Install) => void, installed?: () => void) {
  const nav = navigator as Navigator & { standalone?: boolean };
  if (matchMedia('(display-mode: standalone)').matches || nav.standalone) return;
  const kind = installKind(nav.userAgent, nav.maxTouchPoints);
  set(kind);
  if (kind === 'line' || kind === 'inapp' || kind === 'samsung') return;
  addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e as Deferred;
    set('prompt');
  });
  addEventListener('appinstalled', () => {
    set('no');
    installed?.();
  });
}

/** the browser's own install dialog; it can be shown once per event */
export async function promptInstall(set: (s: Install) => void) {
  const d = deferred;
  deferred = null;
  set('no');
  await d?.prompt();
}
