/* Loaded only in builds made with VITE_E2E=1 (the Playwright tests): a handle
   on the stores and the map so the tests can check state, not just pixels. */
import { inspect } from './map/runtime';
import { collection } from './state/collection';
import { data } from './state/data';
import { location } from './state/location';
import { mapUi } from './state/mapUi';
import { prefs } from './state/prefs';
import { route } from './state/route';

(window as unknown as { __yunabi: unknown }).__yunabi = {
  route,
  prefs,
  collection,
  location,
  mapUi,
  data,
  map: inspect,
};
