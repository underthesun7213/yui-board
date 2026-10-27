import { useState } from 'react';
import type { Lang } from '../domain/types';
import { useT } from '../i18n/useT';
import { prefs } from '../state/prefs';
import { useStore } from '../state/useStore';

/* Shown next to text someone wrote in a language other than the screen's (Y-C5). */
export function LangBadge({ lang }: { lang: Lang }) {
  const m = useT();
  const ui = useStore(prefs, (s) => s.lang);
  if (lang === ui) return null;
  return <span className="lbadge">{m.langBadge[lang]}</span>;
}

/* A description in the screen's language when a translation exists (D32),
   marked as automatic, with the original one tap away. Otherwise the text as
   it was written. */
export function Described({
  text,
  lang,
  tr,
}: {
  text: string;
  lang: Lang;
  tr?: Partial<Record<Lang, string>>;
}) {
  const m = useT();
  const ui = useStore(prefs, (s) => s.lang);
  const [orig, setOrig] = useState(false);
  const t = lang !== ui && tr?.[ui];
  const show = t && !orig;
  return (
    <>
      <p lang={show ? ui : lang}>{show ? t : text}</p>
      {t && (
        <p className="trnote">
          {show && m.autoTranslated}
          <button onClick={() => setOrig(!orig)}>
            {show ? m.showOriginal : m.showTranslation}
          </button>
        </p>
      )}
    </>
  );
}
