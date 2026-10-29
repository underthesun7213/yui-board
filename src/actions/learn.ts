import { ENDINGS } from '../content/endings';
import { BEST_MISSES, VN } from '../content/vn';
import type { Route } from '../content/types';
import { navigate } from '../app/router';
import { t } from '../i18n';
import { store } from '../platform/storage';
import { collection } from '../state/collection';
import { prefs } from '../state/prefs';
import { vn, VN_START } from '../state/vn';
import { yuki, YUKI_START } from '../state/yuki';
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
  const opt = VN[v.route].scenes[v.i]?.opts[i];
  vn.set({ picked: i, score: v.score + (opt?.ok ? 1 : 0), ...(opt?.bet ? { bet: opt.bet } : {}) });
}

/** scenes that ask for a reply: the only ones scored */
export const scoredScenes = (route: Route) => VN[route].scenes.filter((s) => s.opts.length).length;

export function endingFor(route: Route, score: number) {
  const best = score >= scoredScenes(route) - BEST_MISSES;
  return ENDINGS.find((e) => e.route === route && e.best === best)!;
}

export function nextScene() {
  const v = vn.get();
  if (!v.route) return;
  const i = v.i + 1;
  vn.set({ i, picked: null, ball: null, got: null });
  /* the 유우키 미니게임 starts at the drink: the scene before was the doorway */
  if (VN[v.route].scenes[i]?.kind === 'yuki') yuki.set({ ...YUKI_START, step: 'drink' });
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
