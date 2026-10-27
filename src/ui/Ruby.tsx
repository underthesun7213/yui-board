import { Fragment } from 'react';
import { segments } from '../content/ruby';

/* A Japanese line with its furigana, always shown. <rp> keeps the reading in
   brackets where ruby is not drawn (copying, reader mode). */
export function Ruby({ text }: { text: string }) {
  return (
    <>
      {segments(text).map((s, i) =>
        typeof s === 'string' ? (
          <Fragment key={i}>{s}</Fragment>
        ) : (
          <ruby key={i}>
            {s.base}
            <rp>(</rp>
            <rt>{s.rt}</rt>
            <rp>)</rp>
          </ruby>
        ),
      )}
    </>
  );
}
