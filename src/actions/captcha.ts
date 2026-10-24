import { renderCaptcha } from '../platform/turnstile';
import { session } from '../state/session';

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY ?? '';
let token: string | null = null;
let widget: { remove(): void; reset(): void } | null = null;

/** The check passed and this token is waiting to be used once; the check
    is reset so a failed attempt can be confirmed again without a reload. */
export const takeCaptchaToken = () => {
  const t = token;
  if (t) {
    token = null;
    session.set({ captchaReady: false });
    widget?.reset();
  }
  return t ?? undefined;
};

export const captchaNeeded = () => session.set({ captchaRequired: true });

/** Draws the check into `el`; returns a cleanup. */
export function mountCaptcha(el: HTMLElement): () => void {
  let gone = false;
  if (!SITE_KEY) return () => {};
  renderCaptcha(el, SITE_KEY, (t) => {
    token = t;
    session.set({ captchaReady: !!t });
  })
    .then((w) => (gone ? w.remove() : (widget = w)))
    .catch(() => session.set({ captchaReady: false }));
  return () => {
    gone = true;
    widget?.remove();
    widget = null;
  };
}
