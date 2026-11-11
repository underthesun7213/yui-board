import { prefs } from '../state/prefs';

/* The usage statistics switch (D40), used only by the terms screen, so it
   loads with that screen. Sending itself is track() in actions/update.ts,
   which reads the same choice from the device on every event. The code is
   the same chunk track() loads (import(), never a static import: a chunk with
   no dependents keeps the first screen from carrying a preload list). */
const code = () => import('../platform/analytics');

/* the device's choice, read when this screen's code first loads */
code().then(
  (a) => prefs.set({ stats: a.statsOn() }),
  () => {},
);

export function setStats(on: boolean) {
  prefs.set({ stats: on });
  code().then(
    (a) => a.setStatsOn(on),
    () => {},
  );
}
