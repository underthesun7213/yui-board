import { ENDINGS } from '../content/endings';
import { VN } from '../content/vn';
import type { Route } from '../content/types';
import { navigate } from '../app/router';
import { t } from '../i18n';
import { store } from '../platform/storage';
import { collection } from '../state/collection';
import { prefs } from '../state/prefs';
import { vn, VN_START } from '../state/vn';
import { toast } from './ui';

export function openLesson(lid: string) {
  vn.set(VN_START);
  navigate({ name: 'lesson', lid });
}
export const pickRoute = (route: Route) => vn.set({ ...VN_START, route });
export const resetVn = () => vn.set(VN_START);

export function pickOption(i: number) {
  const v = vn.get();
  if (!v.route || v.picked !== null) return;
  const ok = VN[v.route].scenes[v.i]?.opts[i]?.ok;
  vn.set({ picked: i, score: v.score + (ok ? 1 : 0) });
}

export const BEST_SCORE = 4;
export function endingFor(route: Route, score: number) {
  return ENDINGS.find((e) => e.route === route && e.best === score >= BEST_SCORE)!;
}

export function nextScene() {
  const v = vn.get();
  if (!v.route) return;
  const i = v.i + 1;
  vn.set({ i, picked: null });
  if (i < VN[v.route].scenes.length) return;
  const card = endingFor(v.route, v.score);
  const cg = { ...collection.get().cg };
  const fresh = !cg[card.id];
  cg[card.id] = true;
  const other: Route = v.route === 'osaka' ? 'kyoto' : 'osaka';
  if (ENDINGS.some((e) => e.route === other && cg[e.id])) cg.e_both = true;
  collection.set({ cg });
  store.set('cg', cg);
  const m = t(prefs.get().lang);
  toast(fresh ? m.vnGot : m.vnHave);
}
