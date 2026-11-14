import { stats } from '../state/stats';

/* The usage statistics switch (D40), used only by the terms screen, so it
   loads with that screen. The sending code is loaded at start by main.tsx;
   the game's events are sent from actions/learn.ts. Always import(), never a
   static import: a chunk with no dependents carries no preload list. A
   failed load is ignored (Boolean). */
const code = () => import('../platform/analytics');

/* the device's choice, read when this code first loads */
void code().then((a) => stats.set({ on: a.statsOn() }), Boolean);

export function setStats(on: boolean) {
  stats.set({ on });
  void code().then((a) => a.setStatsOn(on), Boolean);
}
