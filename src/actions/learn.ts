import { ENDINGS } from '../content/endings';
import { ENDING_RULE, VN } from '../content/vn';
import type { Route, Tier } from '../content/types';
import { navigate } from '../app/router';
import { t } from '../i18n';
import { store } from '../platform/storage';
import { collection } from '../state/collection';
import { prefs } from '../state/prefs';
import { vn, VN_START } from '../state/vn';
import { yuki, YUKI_START } from '../state/yuki';
import { mt, MT_START } from '../state/matcha';
import { ph, PH_START } from '../state/photo';
import { unlock } from './achievements';
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
  vn.set({
    picked: i,
    score: v.score + (opt?.ok ? 1 : 0),
    ...(opt?.bet ? { bet: opt.bet } : {}),
    ...(opt?.shot ? { shot: opt.shot } : {}),
  });
  if (opt?.ach) unlock(opt.ach);
}

/** scenes that ask for a reply: the only ones scored */
export const scoredScenes = (route: Route) => VN[route].scenes.filter((s) => s.opts.length).length;

export function endingTier(route: Route, score: number): Tier {
  const rule = ENDING_RULE[route];
  if (score >= scoredScenes(route) - rule.goodMisses) return 'good';
  if (rule.badMax !== null && score <= rule.badMax) return 'bad';
  return 'normal';
}
export function endingFor(route: Route, score: number) {
  const tier = endingTier(route, score);
  return ENDINGS.find((e) => e.route === route && e.tier === tier)!;
}

export function nextScene() {
  const v = vn.get();
  if (!v.route) return;
  const i = v.i + 1;
  vn.set({ i, picked: null, ball: null, got: null });
  /* the 유우키 미니게임 starts at the drink: the scene before was the doorway */
  if (VN[v.route].scenes[i]?.kind === 'yuki') yuki.set({ ...YUKI_START, step: 'drink' });
  /* the 아야노 미니게임 starts at the tea house door */
  if (VN[v.route].scenes[i]?.kind === 'matcha') mt.set({ ...MT_START, muted: mt.get().muted });
  /* the photo shoots Ayano, or only the sky after a reply that left her out */
  if (VN[v.route].scenes[i]?.kind === 'photo') ph.set({ ...PH_START, mode: v.shot });
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
