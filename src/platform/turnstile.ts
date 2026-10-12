/* Cloudflare Turnstile, for when the CAPTCHA switch is on (Y-S7, runbook R-2).
   The script loads only then; the CSP already allows its origin. */
interface Turnstile {
  render(
    el: HTMLElement,
    opts: { sitekey: string; callback(token: string): void; 'expired-callback'(): void },
  ): string;
  remove(id: string): void;
  reset(id: string): void;
}
declare global {
  interface Window {
    turnstile?: Turnstile;
  }
}

let script: Promise<Turnstile> | null = null;
function load(): Promise<Turnstile> {
  script ??= new Promise((ok, no) => {
    const s = document.createElement('script');
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    s.async = true;
    s.onload = () => (window.turnstile ? ok(window.turnstile) : no(new Error('turnstile')));
    s.onerror = () => {
      script = null;
      no(new Error('turnstile'));
    };
    document.head.append(s);
  });
  return script;
}

export async function renderCaptcha(
  el: HTMLElement,
  sitekey: string,
  onToken: (t: string | null) => void,
) {
  const t = await load();
  const id = t.render(el, {
    sitekey,
    callback: (tok) => onToken(tok),
    'expired-callback': () => onToken(null),
  });
  return { remove: () => t.remove(id), reset: () => t.reset(id) };
}
