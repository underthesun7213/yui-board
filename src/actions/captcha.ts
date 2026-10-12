import { renderCaptcha } from '../platform/turnstile';
import { session } from '../state/session';

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY ?? '';
let token: string | null = null;

/** The check passed and this token is waiting to be used once. */
export const takeCaptchaToken = () => {
  const t = token;
  token = null;
  return t ?? undefined;
};

export const captchaNeeded = () => session.set({ captchaRequired: true });

/** Draws the check into `el`; returns a cleanup. */
export function mountCaptcha(el: HTMLElement): () => void {
  let cleanup: (() => void) | null = null;
  let gone = false;
  if (!SITE_KEY) return () => {};
  renderCaptcha(el, SITE_KEY, (t) => {
    token = t;
    session.set({ captchaReady: !!t });
  })
    .then((c) => (gone ? c() : (cleanup = c)))
    .catch(() => session.set({ captchaReady: false }));
  return () => {
    gone = true;
    cleanup?.();
  };
}
