import s1 from '../../install/install-step1.jpg';
import s2 from '../../install/install-step2.jpg';
import s3 from '../../install/install-step3.jpg';
import s4 from '../../install/install-step4.jpg';
import s5 from '../../install/install-step5.jpg';
import s6 from '../../install/install-step6.jpg';
import { useT } from '../../i18n/useT';

/* iPhone's Add to Home Screen, one Safari screenshot per step (the owner's,
   people in the share sheet replaced): its own chunk, loaded when "Install
   app" is opened, and left out of the install download (vite.config.ts). */
const SHOTS = [s1, s2, s3, s4, s5, s6];

export default function InstallSteps() {
  const m = useT();
  return (
    <div className="installsteps">
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
