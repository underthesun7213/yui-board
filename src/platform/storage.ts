/* Device storage under yui.v1.*. Every access is guarded: private modes and
   blocked storage throw, and the render check runs without localStorage. The
   key prefix is an internal name and stays as it was in v1.3. */
export const store = {
  get<T>(k: string, d: T): T {
    try {
      const v = localStorage.getItem('yui.v1.' + k);
      return v == null ? d : (JSON.parse(v) as T);
    } catch {
      return d;
    }
  },
  set(k: string, v: unknown): void {
    try {
      localStorage.setItem('yui.v1.' + k, JSON.stringify(v));
    } catch {
      /* storage full or blocked: keep working in memory */
    }
  },
};
