import { prefs } from '../../state/prefs';
import { useStore } from '../../state/useStore';
import { vnEn } from '../../state/vnEn';

/** The English under a line of episode 8, as under a comic panel: none on the
    Japanese screen, and none until the translations have loaded. A span, since
    it also sits inside the reply buttons. */
export function VnTr({ jp }: { jp: string }) {
  const lang = useStore(prefs, (s) => s.lang);
  const text = useStore(vnEn, (s) => s.texts?.[jp]);
  if (lang === 'ja' || !text) return null;
  return (
    <span className="vntr" lang="en">
      {text}
    </span>
  );
}
