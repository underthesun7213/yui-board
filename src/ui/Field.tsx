import type { ReactNode } from 'react';
import { fill } from '../i18n';
import { useT } from '../i18n/useT';

/* One labelled form field with its hint, a character counter and the error
   for it. The error is tied to the input by aria-describedby. */
export function Field({
  id,
  label,
  hint,
  error,
  count,
  optional,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string | null;
  count?: [number, number];
  optional?: boolean;
  children: ReactNode;
}) {
  const m = useT();
  return (
    <div className={'field' + (error ? ' bad' : '')}>
      <label htmlFor={id}>
        {label}
        {optional && <span className="opt">{m.optional}</span>}
        {count && <span className="count">{fill(m.chars, { n: count[0], m: count[1] })}</span>}
      </label>
      {children}
      {hint && (
        <p className="hint" id={id + '-hint'}>
          {hint}
        </p>
      )}
      {error && (
        <p className="err" id={id + '-err'} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export const describedBy = (id: string, hint?: boolean, error?: string | null) =>
  [hint && id + '-hint', error && id + '-err'].filter(Boolean).join(' ') || undefined;

/** Writing is possible: online, not framed in another page. */
export function WriteBlocked({ online, framed }: { online: boolean; framed: boolean }) {
  const m = useT();
  if (framed)
    return (
      <p className="dstatus warn" role="status">
        {m.framed}
      </p>
    );
  if (!online)
    return (
      <p className="dstatus warn" role="status">
        {m.offlineWrite}
      </p>
    );
  return null;
}
