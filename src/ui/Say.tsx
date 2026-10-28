import { sayLine } from '../actions/voice';
import { VOICE } from '../content/voice';
import { useT } from '../i18n/useT';

/* A play button for one recorded line (D35); nothing for a line not recorded
   yet or changed since it was. */
export function Say({ k }: { k: string }) {
  const m = useT();
  if (!VOICE[k]) return null;
  return (
    <button type="button" className="say" aria-label={m.playLine} onClick={() => sayLine(k)}>
      <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
        <path d="M4 2.5v11l9-5.5z" fill="currentColor" />
      </svg>
    </button>
  );
}
