import { beforeEach, describe, expect, it, vi } from 'vitest';

const geo = vi.hoisted(() => ({
  next: null as
    null | { ok: true; loc: { lat: number; lng: number } } | { ok: false; denied: boolean },
}));
vi.mock('../../src/platform/geolocation', () => ({ getPosition: async () => geo.next }));
vi.mock('../../src/map/runtime', () => ({
  forgetView: vi.fn(),
  setHandlers() {},
  setPrefGeo() {},
}));

const { locate, setMode } = await import('../../src/actions/map');
const { endingFor, nextScene, pickOption, pickRoute, playBall, scoredScenes } =
  await import('../../src/actions/learn');
const { yuki } = await import('../../src/state/yuki');
const { location } = await import('../../src/state/location');
const { mapUi } = await import('../../src/state/mapUi');
const { collection } = await import('../../src/state/collection');
const { vn } = await import('../../src/state/vn');
const { VN } = await import('../../src/content/vn');

describe('location', () => {
  beforeEach(() => location.set({ state: 'ask', loc: null, refreshing: false }));

  it('keeps the last fix while refreshing and when the refresh fails', async () => {
    location.set({ state: 'ok', loc: { lat: 35.68, lng: 139.76 } });
    geo.next = { ok: false, denied: false };
    const p = locate();
    expect(location.get()).toMatchObject({ state: 'ok', refreshing: true });
    await p;
    expect(location.get()).toEqual({
      state: 'ok',
      loc: { lat: 35.68, lng: 139.76 },
      refreshing: false,
    });
  });

  it('only refits after a refresh that moved', async () => {
    mapUi.set({ mode: 'near' });
    location.set({ state: 'ok', loc: { lat: 35.68, lng: 139.76 } });
    const seq = mapUi.get().fitSeq;
    geo.next = { ok: true, loc: { lat: 35.6801, lng: 139.7601 } };
    await locate();
    expect(mapUi.get().fitSeq).toBe(seq);
    geo.next = { ok: true, loc: { lat: 34.82, lng: 135.65 } };
    await locate();
    expect(mapUi.get().fitSeq).toBe(seq + 1);
  });

  it('drops the last fix when permission was withdrawn', async () => {
    location.set({ state: 'ok', loc: { lat: 35.68, lng: 139.76 } });
    geo.next = { ok: false, denied: true };
    await locate();
    expect(location.get()).toMatchObject({ state: 'denied', loc: null, refreshing: false });
  });

  it('reports denied and failed first attempts', async () => {
    geo.next = { ok: false, denied: true };
    await locate();
    expect(location.get().state).toBe('denied');
    geo.next = { ok: false, denied: false };
    await locate();
    expect(location.get().state).toBe('fail');
  });

  it('a mode switch keeps the prefecture and does not re-locate', () => {
    location.set({ state: 'ok', loc: { lat: 1, lng: 1 } });
    mapUi.set({ mode: 'japan', pref: '27' });
    setMode('near');
    setMode('japan');
    expect(mapUi.get().pref).toBe('27');
    expect(location.get().refreshing).toBe(false);
  });
});

describe('episode 8', () => {
  const play = (route: 'osaka' | 'kyoto', good: boolean) => {
    pickRoute(route);
    for (const sc of VN[route].scenes) {
      const i = sc.opts.findIndex((o) => o.ok === good);
      pickOption(i < 0 ? 0 : i);
      nextScene();
    }
  };
  beforeEach(() => collection.set({ cg: {} }));

  it('scores replies and gives the matching ending', () => {
    play('osaka', true);
    expect(vn.get().score).toBe(scoredScenes('osaka'));
    expect(collection.get().cg).toEqual({ [endingFor('osaka', 5).id]: true });
    play('osaka', false);
    expect(collection.get().cg[endingFor('osaka', 0).id]).toBe(true);
    expect(endingFor('osaka', 0).best).toBe(false);
  });

  it('gives the best ending with at most one miss on either route', () => {
    for (const r of ['osaka', 'kyoto'] as const) {
      const n = scoredScenes(r);
      expect(endingFor(r, n).best).toBe(true);
      expect(endingFor(r, n - 1).best).toBe(true);
      expect(endingFor(r, n - 2).best).toBe(false);
    }
  });

  it('scores only the scenes that ask for a reply', () => {
    expect(scoredScenes('osaka')).toBe(VN.osaka.scenes.filter((s) => s.opts.length).length);
    expect(scoredScenes('osaka')).toBeLessThan(VN.osaka.scenes.length);
  });

  it('starts the 유우키 미니게임 at its scene, at the drink', () => {
    pickRoute('osaka');
    const at = VN.osaka.scenes.findIndex((s) => s.kind === 'yuki');
    yuki.set({ step: 'end' });
    for (let i = 0; i < at; i++) nextScene();
    expect(vn.get().i).toBe(at);
    expect(yuki.get().step).toBe('drink');
  });

  it('plays the smart-ball match once per scene', () => {
    pickRoute('osaka');
    playBall(0.1);
    expect(vn.get().ball).toBe('win');
    playBall(0.9);
    expect(vn.get().ball).toBe('win');
    nextScene();
    expect(vn.get().ball).toBe(null);
    playBall(0.9);
    expect(vn.get().ball).toBe('lose');
  });

  it('gives the both-routes card only after both routes', () => {
    play('kyoto', false);
    expect(collection.get().cg.e_both).toBeUndefined();
    play('osaka', true);
    expect(collection.get().cg.e_both).toBe(true);
  });

  it('ignores a second pick on the same scene', () => {
    pickRoute('kyoto');
    const ok = VN.kyoto.scenes[0]!.opts.findIndex((o) => o.ok);
    pickOption(ok);
    pickOption(ok);
    expect(vn.get().score).toBe(1);
  });
});
