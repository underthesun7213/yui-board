import { createStore } from './store';

export type Route =
  | { name: 'home' }
  | { name: 'learn' }
  | { name: 'lesson'; lid: string }
  | { name: 'collection' }
  | { name: 'map' }
  | { name: 'cal' }
  | { name: 'event'; id: number; date: string };
export type RouteName = Route['name'];

/** prev: the screen this history entry was opened from (for ‹). */
export const route = createStore<{ route: Route; prev: RouteName | null }>({
  route: { name: 'home' },
  prev: null,
});
