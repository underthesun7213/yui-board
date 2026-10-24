import { useEffect, useRef } from 'react';
import { mountCaptcha } from '../actions/captcha';
import { useT } from '../i18n/useT';
import { session } from '../state/session';
import { useStore } from '../state/useStore';

/* Shown only when the server asked for it (the CAPTCHA switch is on). */
export function Captcha() {
  const m = useT();
  const needed = useStore(session, (s) => s.captchaRequired);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!needed || !box.current) return;
    return mountCaptcha(box.current);
  }, [needed]);
  if (!needed) return null;
  return <div className="captcha" ref={box} role="group" aria-label={m.aCaptcha} />;
}
