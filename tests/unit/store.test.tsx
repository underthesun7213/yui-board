import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { createStore } from '../../src/state/store';
import { useStore } from '../../src/state/useStore';

describe('store', () => {
  it('keeps the same snapshot when nothing changes', () => {
    const s = createStore({ a: 1, b: 'x' });
    const fn = vi.fn();
    s.subscribe(fn);
    const before = s.get();
    s.set({ a: 1 });
    expect(s.get()).toBe(before);
    expect(fn).not.toHaveBeenCalled();
    s.set((p) => ({ a: p.a + 1 }));
    expect(s.get()).toEqual({ a: 2, b: 'x' });
    expect(fn).toHaveBeenCalledTimes(1);
  });
  it('renders on the server (getServerSnapshot)', () => {
    const s = createStore({ n: 7 });
    function C() {
      return <b>{useStore(s, (x) => x.n)}</b>;
    }
    expect(renderToString(<C />)).toBe('<b>7</b>');
  });
});
