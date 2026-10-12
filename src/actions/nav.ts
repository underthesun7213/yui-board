import { navigate } from '../app/router';
import { TABS } from '../app/routes';
import type { Lang } from '../domain/types';
import { loadLang } from '../i18n';
import { store } from '../platform/storage';
import { calendarUi } from '../state/calendarUi';
import { prefs } from '../state/prefs';
import { route, type Route } from '../state/route';

export function go(to: Route) {
  navigate(to);
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
