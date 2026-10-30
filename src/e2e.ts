/* Loaded only in builds made with VITE_E2E=1 (the Playwright tests): a handle
   on the stores and the map so the tests can check state, not just pixels. */
import { inspect } from './map/runtime';
import { settleArt } from './minigames/matcha';
import { settle } from './minigames/smartball';
import { collection } from './state/collection';
import { data, setData } from './state/data';
import { location } from './state/location';
import { mt } from './state/matcha';
import { mapUi } from './state/mapUi';
import { prefs } from './state/prefs';
import { route } from './state/route';
import { yuki } from './state/yuki';

(window as unknown as { __yunabi: unknown }).__yunabi = {
  route,
  prefs,
  collection,
  location,
  mapUi,
  data,
  setData,
  yuki,
  sbSettle: settle,
  mt,
  mtSettle: settleArt,
  map: inspect,
};
