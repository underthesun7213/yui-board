/* A small external store. Snapshots are replaced, never mutated, and a set()
   that changes nothing keeps the old object, so useSyncExternalStore does not
   loop. React reads it through useStore; the router, the map runtime and the
   storage sync subscribe directly. */
export interface Store<T extends object> {
  get(): T;
  set(patch: Partial<T> | ((s: T) => Partial<T>)): void;
  subscribe(fn: (s: T, prev: T) => void): () => void;
}

export function createStore<T extends object>(initial: T): Store<T> {
  let state = initial;
  const subs = new Set<(s: T, prev: T) => void>();
  const get = () => state;
  const set: Store<T>['set'] = (patch) => {
    const p = typeof patch === 'function' ? patch(state) : patch;
    let changed = false;
    for (const k in p) if (!Object.is(p[k], state[k])) changed = true;
    if (!changed) return;
    const prev = state;
    state = { ...state, ...p };
    for (const fn of [...subs]) fn(state, prev);
  };
  const subscribe = (fn: (s: T, prev: T) => void) => {
    subs.add(fn);
    return () => {
      subs.delete(fn);
    };
  };
  return { get, set, subscribe };
}
