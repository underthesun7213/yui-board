import { navigate } from '../app/router';
import type { Route as VnRoute } from '../content/types';
import { TABS } from '../app/routes';
import type { Lang } from '../domain/types';
import { loadLang } from '../i18n';
import { store } from '../platform/storage';
import { calendarUi } from '../state/calendarUi';
import { prefs } from '../state/prefs';
import { route, type Route } from '../state/route';
import { vn, VN_START } from '../state/vn';

export function go(to: Route) {
  navigate(to);
}

/* Home's banner: straight into episode 8 on the route whose side was tapped.
   Here and not in actions/learn, which brings the game's content along. */
export function openRoute(r: VnRoute) {
  vn.set({ ...VN_START, route: r });
  navigate({ name: 'lesson', lid: 'l8' });
}

/* A tab opens its root screen; tapping the tab you are on replaces the entry. */
export function tab(i: number) {
  const to = TABS[i];
  if (!to) return;
  if (to.name === 'cal') calendarUi.set({ day: null, month: null });
  navigate(to, { replace: route.get().route.name === to.name });
}

export async function setLang(lang: Lang) {
  try {
    await loadLang(lang);
  } catch {
    return; /* offline and not cached: stay in the current language */
  }
  store.set('lang', lang);
  prefs.set({ lang });
}
