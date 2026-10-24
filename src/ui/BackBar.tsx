import type { ReactNode } from 'react';
import { back } from '../app/router';
import { useT } from '../i18n/useT';

export function BackBar({ title, right }: { title: ReactNode; right?: ReactNode }) {
  const m = useT();
  return (
    <div className="bar">
      <button className="back" aria-label={m.back} onClick={back}>
        ‹
      </button>
      <h1>{title}</h1>
      {right != null && <span className="right">{right}</span>}
    </div>
  );
}
