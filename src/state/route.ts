import { createStore } from './store';

export type Route =
  | { name: 'home' }
  | { name: 'learn' }
  | { name: 'lesson'; lid: string }
  | { name: 'collection' }
  | { name: 'map' }
  | { name: 'cal' }
  | { name: 'event'; id: number; date: string }
  | { name: 'placeNew' }
  | { name: 'placeEdit'; id: number }
  | { name: 'eventNew' }
  | { name: 'eventEdit'; id: number }
  | { name: 'weekEdit'; id: number; date: string }
  | { name: 'me' }
  | { name: 'legal' };
export type RouteName = Route['name'];

/** prev: the screen this history entry was opened from (for ‹).
    taps: counts navigations by tap (not system back), which scroll to the top. */
export const route = createStore<{ route: Route; prev: RouteName | null; taps: number }>({
  route: { name: 'home' },
  prev: null,
  taps: 0,
});
