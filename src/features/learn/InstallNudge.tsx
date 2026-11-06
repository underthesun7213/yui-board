import { lazy, Suspense, useState } from 'react';
import { installApp } from '../../actions/update';
import { INSTALL_TEXT } from '../../content/install';
import { useT } from '../../i18n/useT';
import { prefs } from '../../state/prefs';
import { ui } from '../../state/ui';
import { useStore } from '../../state/useStore';

const InstallSteps = lazy(() => import('../home/InstallSteps'));

/* At a game's ending, when someone has just enjoyed it: offer to keep the app. */
export default function InstallNudge() {
  const m = useT();
  const lang = useStore(prefs, (s) => s.lang);
  const install = useStore(ui, (s) => s.install);
  const [steps, setSteps] = useState(false);
  if (install === 'no') return null;
  const inApp = install === 'line' || install === 'inapp';
  return (
    <div className="endinstall">
      <p>{INSTALL_TEXT[lang].installEnd}</p>
      {!inApp && (
        <button
          className="secondary"
          data-install-end
          aria-expanded={install === 'prompt' ? undefined : steps}
          onClick={() => (install === 'prompt' ? void installApp() : setSteps(!steps))}
        >
          + {m.install}
        </button>
      )}
      {(inApp || (steps && install !== 'prompt')) && (
        <Suspense fallback={null}>
          <InstallSteps />
        </Suspense>
      )}
    </div>
  );
}
