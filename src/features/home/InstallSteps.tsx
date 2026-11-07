import s1 from '../../install/install-step1.jpg';
import s2 from '../../install/install-step2.jpg';
import s3 from '../../install/install-step3.jpg';
import s4 from '../../install/install-step4.jpg';
import s5 from '../../install/install-step5.jpg';
import s6 from '../../install/install-step6.jpg';
import { INSTALL_TEXT } from '../../content/install';
import { prefs } from '../../state/prefs';
import { ui } from '../../state/ui';
import { useStore } from '../../state/useStore';

/* How to install where the browser cannot do it on a tap. iPhone's Add to Home
   Screen has one Safari screenshot per step (the owner's, people in the share
   sheet replaced). Its own chunk, loaded when needed, and left out of the
   install download (vite.config.ts). */
const SHOTS = [s1, s2, s3, s4, s5, s6];

export default function InstallSteps() {
  const m = INSTALL_TEXT[useStore(prefs, (s) => s.lang)];
  const install = useStore(ui, (s) => s.install);
  if (install === 'line' || install === 'inapp')
    return (
      <div className="installsteps" data-install={install}>
        <p>{m.installInApp}</p>
        {/* LINE opens a link with this parameter in the phone's own browser */}
        {install === 'line' && (
          <a className="glink" href="/?openExternalBrowser=1">
            {m.installOpenBrowser}
          </a>
        )}
      </div>
    );
  if (install === 'samsung')
    return (
      <div className="installsteps" data-install={install}>
        <p>{m.installSamsung}</p>
      </div>
    );
  if (install === 'android')
    return (
      <div className="installsteps" data-install={install}>
        <p>{m.installAndroid}</p>
        <ol className="words">
          {m.installAndroidStep.map((s, i) => (
            <li key={s}>
              {i + 1}. {s}
            </li>
          ))}
        </ol>
      </div>
    );
  return (
    <div className="installsteps" data-install={install}>
      <p>{m.installIos}</p>
      <ol>
        {SHOTS.map((src, i) => (
          <li key={src}>
            <span>
              {i + 1}. {m.installStep[i]}
            </span>
            <img src={src} alt="" loading="lazy" />
          </li>
        ))}
      </ol>
    </div>
  );
}
