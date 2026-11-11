/* Usage statistics (D40): a handful of events to Mixpanel, sent straight to
   its HTTP API (no SDK, no cookies). Only in a build with the project token,
   and only while this device has not turned it off; a browser that sends
   Global Privacy Control starts with it off. Each event carries a random ID
   kept on this device (yui.v1.aid), the screen language, installed or not and
   the kind of phone. Mixpanel is told not to use the IP address (ip=0); never
   the page address, location or anything the person wrote. Named in the privacy policy §5. */

/* The two keys, read and written as platform/storage does (same yui.v1.*
   names and JSON). Not imported from it: a chunk with no dependencies keeps
   the first screen from carrying a preload list for it. */
const store = {
  get<T>(k: string, d: T): T {
    try {
      const v = localStorage.getItem('yui.v1.' + k);
      return v == null ? d : (JSON.parse(v) as T);
    } catch {
      return d;
    }
  },
  set(k: string, v: unknown) {
    try {
      localStorage.setItem('yui.v1.' + k, JSON.stringify(v));
    } catch {
      /* blocked storage: statistics simply stay off for this visit's ID */
    }
  },
};

const TOKEN = /^[a-f0-9]{32}$/.test(import.meta.env.VITE_MIXPANEL_TOKEN ?? '')
  ? (import.meta.env.VITE_MIXPANEL_TOKEN as string)
  : '';
const API = 'https://api-js.mixpanel.com/track?ip=0';

export type Props = Record<string, string | number>;

/** the device's choice, or the default: on unless the browser asks for privacy */
export function statsOn(): boolean {
  const c = store.get<string | null>('stats', null);
  if (c === 'on' || c === 'off') return c === 'on';
  try {
    return !(navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl;
  } catch {
    return true;
  }
}

/** turning off also forgets the random ID; turning on again makes a new one */
export function setStatsOn(on: boolean) {
  store.set('stats', on ? 'on' : 'off');
  if (!on) store.set('aid', null);
}

const rand = () => {
  try {
    return crypto.randomUUID();
  } catch {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
};

function deviceId(): string {
  const have = store.get<string | null>('aid', null);
  if (have && /^[\w-]{8,64}$/.test(have)) return have;
  const id = rand();
  store.set('aid', id);
  return id;
}

function platform(): string {
  const ua = navigator.userAgent;
  if (/iP(hone|ad|od)/.test(ua) || (/Mac/.test(ua) && navigator.maxTouchPoints > 1)) return 'ios';
  if (/Android/.test(ua)) return /SamsungBrowser/.test(ua) ? 'android-samsung' : 'android';
  return 'other';
}

function installed(): boolean {
  try {
    return (
      matchMedia('(display-mode: standalone)').matches ||
      !!(navigator as Navigator & { standalone?: boolean }).standalone
    );
  } catch {
    return false;
  }
}

export function send(event: string, props: Props = {}) {
  if (!TOKEN || !statsOn()) return;
  try {
    const properties = {
      ...props,
      /* the screen language: main.tsx keeps <html lang> in step with it */
      lang: document.documentElement.lang || 'en',
      token: TOKEN,
      time: Date.now(),
      distinct_id: deviceId(),
      $insert_id: rand().replace(/-/g, '').slice(0, 32),
      mode: installed() ? 'installed' : 'browser',
      platform: platform(),
    };
    void fetch(API, {
      method: 'POST',
      /* a simple request: no preflight, nothing read back */
      mode: 'no-cors',
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      keepalive: true,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'data=' + encodeURIComponent(JSON.stringify([{ event, properties }])),
    }).catch(() => {});
  } catch {
    /* statistics never get in the way */
  }
}
