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
