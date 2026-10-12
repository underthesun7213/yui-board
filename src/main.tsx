import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { startData } from './actions/data';
import { refreshMine } from './actions/write';
import { enterMap, ensurePrefs } from './actions/map';
import { watchForUpdates } from './actions/update';
import { App } from './app/App';
import { onRouteChange, startRouter } from './app/router';
import { ROOTS } from './app/routes';
import { preload } from './app/screens';
import { LANGS, type Lang } from './domain/types';
import { isLoaded, loadLang } from './i18n';
import { store } from './platform/storage';
import { collection } from './state/collection';
import { location } from './state/location';
import { mapUi } from './state/mapUi';
import { prefs } from './state/prefs';
import { route } from './state/route';
import './styles/tokens.css';
import './styles/base.css';
import './styles/screens.css';

/* Restore what this device remembers (same keys as v1.3). */
const lang = store.get<string>('lang', 'en');
const startLang: Lang = LANGS.includes(lang as Lang) ? (lang as Lang) : 'en';
/* the chosen language's strings before the first paint (English is built in) */
await loadLang(startLang).catch(() => {});
prefs.set({ lang: isLoaded(startLang) ? startLang : 'en' });
const cg = store.get<unknown>('cg', {});
if (cg && typeof cg === 'object' && !Array.isArray(cg)) {
  const ok: Record<string, true> = {};
  for (const [k, v] of Object.entries(cg)) if (v === true) ok[k] = true;
  collection.set({ cg: ok });
}
const c = store.get<string | null>('loc', null);
location.set({ state: c === 'use' ? 'idle' : c === 'skip' ? 'skip' : 'ask' });

/* Attributes outside React's tree follow the stores directly. */
const syncDoc = () => {
  document.documentElement.lang = prefs.get().lang;
  document.body.dataset.top = ROOTS.includes(route.get().route.name) ? 'navy' : 'plain';
};
prefs.subscribe(syncDoc);
route.subscribe(syncDoc);
syncDoc();

onRouteChange((to, from, how) => {
  if (to.name !== 'map') return;
  if (from.name !== 'map' || how === 'push') enterMap();
  else if (mapUi.get().mode === 'japan') void ensurePrefs();
});
startRouter();
void startData();
void refreshMine();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

if (import.meta.env.VITE_E2E) void import('./e2e');
watchForUpdates();
const idle = (fn: () => void) =>
  'requestIdleCallback' in window ? requestIdleCallback(fn) : setTimeout(fn, 1500);
addEventListener('load', () => idle(preload));
