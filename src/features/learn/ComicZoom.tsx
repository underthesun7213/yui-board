import { useEffect, useRef } from 'react';
import { closeZoom } from '../../actions/comic';
import { ART, pageKey } from '../../content/art';
import { fill } from '../../i18n';
import { useT } from '../../i18n/useT';
import { ui } from '../../state/ui';
import { useStore } from '../../state/useStore';

/* A comic page full screen (Y-J1), over everything including the tab bar.
   Pinch zoom is the browser's own; the page also scrolls when it is taller
   than the screen. Closed by its button, Escape, or system back (it is a
   history step). Focus goes back to what opened it — or, if that button is
   gone (the image failed meanwhile), to the page's heading. */
export function ComicZoom() {
  const m = useT();
  const zoom = useStore(ui, (s) => s.zoom);
  const close = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    close.current?.focus();
    const esc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeZoom();
    };
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('keydown', esc);
      if (opener?.isConnected) opener.focus();
      else if (zoom) document.querySelector<HTMLElement>(`[data-page="${zoom.n}"]`)?.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per opening
  }, []);
  const src = zoom && ART[pageKey(zoom.lid, zoom.n)];
  if (!zoom || !src) return null;
  const label = fill(m.zoomPage, { n: zoom.n });
  return (
    <div className="zoom" role="dialog" aria-modal="true" aria-label={label}>
      <button ref={close} className="zoomx" aria-label={m.close} onClick={closeZoom}>
        ✕
      </button>
      <div className="zoomscroll">
        <img src={src} alt="" />
      </div>
    </div>
  );
}
