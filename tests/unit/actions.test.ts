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
const { endingFor, nextScene, pickOption, pickRoute, scoredScenes } =
  await import('../../src/actions/learn');
const { endBall } = await import('../../src/actions/achievements');
const { nextYuki } = await import('../../src/actions/yuki');
const { yuki, YUKI_START } = await import('../../src/state/yuki');
const { ACH_BET, ACH_NO_DOUBLE_DIP } = await import('../../src/content/achievements');
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
    expect(endingFor('osaka', 0).tier).toBe('bad');
  });

  it('Osaka: all right is good, two to four normal, one or none bad', () => {
    const n = scoredScenes('osaka');
    expect(n).toBe(5);
    expect(endingFor('osaka', 5).tier).toBe('good');
    for (const s of [2, 3, 4]) expect(endingFor('osaka', s).tier).toBe('normal');
    for (const s of [0, 1]) expect(endingFor('osaka', s).tier).toBe('bad');
    expect(endingFor('osaka', 1).id).toBe('e_osaka_bad');
  });

  it('Kyoto keeps one miss for good and has no bad card yet', () => {
    const n = scoredScenes('kyoto');
    expect(endingFor('kyoto', n).tier).toBe('good');
    expect(endingFor('kyoto', n - 1).tier).toBe('good');
    expect(endingFor('kyoto', 0).tier).toBe('normal');
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

  /* walk the Osaka route up to the scene that asks for the bet */
  const toBet = () => {
    pickRoute('osaka');
    const at = VN.osaka.scenes.findIndex((s) => s.opts.some((o) => o.bet));
    for (let i = 0; i < at; i++) nextScene();
    return VN.osaka.scenes[at]!.opts;
  };

  it('unlocks the picture of the bet taken, win or lose, and only once', () => {
    const opts = toBet();
    pickOption(opts.findIndex((o) => o.bet === 'takoyaki'));
    expect(vn.get().bet).toBe('takoyaki');
    nextScene();
    endBall('lose');
    expect(vn.get().ball).toBe('lose');
    expect(collection.get().cg[ACH_BET.takoyaki]).toBe(true);
    expect(vn.get().got).toBe(ACH_BET.takoyaki);
    expect(collection.get().cg[ACH_BET.juice]).toBeUndefined();
    /* the rematch changes the result, not what is owned or shown again */
    vn.set({ got: null });
    endBall('win');
    expect(vn.get().ball).toBe('win');
    expect(vn.get().got).toBe(null);
    nextScene();
    expect(vn.get().got).toBe(null);
  });

  it('unlocks nothing when the bet was turned down', () => {
    const opts = toBet();
    pickOption(opts.findIndex((o) => !o.bet));
    nextScene();
    endBall('win');
    expect(Object.keys(collection.get().cg).filter((k) => k.startsWith('a_'))).toEqual([]);
  });

  it('gives the kushikatsu picture for leaving the shop without a second dip', () => {
    yuki.set({ ...YUKI_START, step: 'leave', warned: 1 });
    nextYuki();
    expect(yuki.get().step).toBe('end');
    expect(collection.get().cg[ACH_NO_DOUBLE_DIP]).toBeUndefined();
    yuki.set({ ...YUKI_START, step: 'leave', warned: 0 });
    nextYuki();
    expect(collection.get().cg[ACH_NO_DOUBLE_DIP]).toBe(true);
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
