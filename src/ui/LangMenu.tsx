import { useEffect, useRef, useState } from 'react';
import { setLang } from '../actions/nav';
import { LANGS } from '../domain/types';
import { LANG_NAME } from '../i18n';
import { useT } from '../i18n/useT';
import { prefs } from '../state/prefs';
import { useStore } from '../state/useStore';

export function LangMenu() {
  const m = useT();
  const lang = useStore(prefs, (s) => s.lang);
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  /* a tap anywhere else closes the menu and still does what it was for */
  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);
  return (
    <div className="lang" ref={box}>
      <button
        className="globe"
        aria-expanded={open}
        aria-label={m.aLang}
        onClick={() => setOpen(!open)}
      >
        <span className="g" aria-hidden="true">
          🌐
        </span>
        {LANG_NAME[lang]}
        <span className="v" aria-hidden="true">
          ▼
        </span>
      </button>
      <div className="langmenu" hidden={!open}>
        {LANGS.map((l) => (
          <button
            key={l}
            lang={l}
            data-l={l}
            aria-pressed={lang === l}
            onClick={() => {
              void setLang(l);
              setOpen(false);
            }}
          >
            {LANG_NAME[l]}
          </button>
        ))}
      </div>
    </div>
  );
}
