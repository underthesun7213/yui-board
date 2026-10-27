import { useId, useState } from 'react';
import { openZoom } from '../../actions/comic';
import { ART, pageKey } from '../../content/art';
import type { Page } from '../../content/types';
import { fill } from '../../i18n';
import { useT } from '../../i18n/useT';
import { prefs } from '../../state/prefs';
import { useStore } from '../../state/useStore';

/* One comic page (Y-J1): the artwork, then its four panels as a list — the
   Japanese of the balloons and caption boxes, and a translation unless the
   screen is in Japanese. The image is decoration for the list below, so the
   button names the action rather than repeating the lines. */
export function ComicPage({ lid, n, page }: { lid: string; n: 1 | 2; page: Page }) {
  const m = useT();
  const lang = useStore(prefs, (s) => s.lang);
  const head = useId();
  const src = ART[pageKey(lid, n)];
  /* a page not cached yet and opened offline falls back to the gray box */
  const [failed, setFailed] = useState(false);
  const label = fill(m.zoomPage, { n });
  return (
    <section className="cpage" aria-labelledby={head}>
      <h2 id={head} className="cpagen" tabIndex={-1} data-page={n}>
        {fill(m.pageN, { n })}
      </h2>
      {src && !failed ? (
        <button
          className="cpageart"
          aria-label={label}
          data-zoom={n}
          onClick={() => openZoom(lid, n)}
        >
          <img src={src} alt="" onError={() => setFailed(true)} />
        </button>
      ) : (
        <div className="cpageart" aria-hidden="true" />
      )}
      <ol className="panels" role="list">
        {page.panels.map((p, i) => (
          <li key={i}>
            {p.cap && (
              <p className="cap" lang="ja">
                {p.cap}
              </p>
            )}
            {p.jp && (
              <p className="jp" lang="ja">
                {p.jp}
              </p>
            )}
            {lang !== 'ja' && <p className="tr">{p.tr[lang]}</p>}
          </li>
        ))}
      </ol>
    </section>
  );
}
