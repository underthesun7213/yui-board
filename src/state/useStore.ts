import { useCallback, useSyncExternalStore } from 'react';
import type { Store } from './store';

/* The selector must return a primitive or an object already in the store:
   a fresh object every call would re-render forever. The same getter serves
   as the server snapshot so the render check can run in Node. */
export function useStore<T extends object, R>(store: Store<T>, select: (s: T) => R): R {
  const get = useCallback(() => select(store.get()), [store, select]);
  return useSyncExternalStore(store.subscribe, get, get);
}
