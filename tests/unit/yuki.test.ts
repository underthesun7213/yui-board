/* 유우키 미니게임: the order rules, reading yen aloud, and the one rule of
   the house (dip once, bite twice). */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  addItem,
  biteSkewer,
  dipSkewer,
  nextYuki,
  pickTalk,
  pickUnit,
  placeOrder,
  tapSkewer,
} from '../../src/actions/yuki';
import { kindsIn, orderOk, orderTotal, yenKana } from '../../src/content/yuki-minigame';
import { yuki, YUKI_START } from '../../src/state/yuki';

beforeEach(() => {
  vi.useFakeTimers();
  yuki.set(YUKI_START);
});

describe('order', () => {
  it('needs four kinds and at most ¥2,000 with the drink', () => {
    const four = { gyu: 2, uzura: 1, tama: 1, ebi: 1 };
    expect(kindsIn(four)).toBe(4);
    expect(orderTotal(four, 'beer')).toBe(150 * 2 + 120 + 110 + 220 + 550);
    expect(orderOk(four, 'beer')).toBe(true);
    expect(orderOk({ gyu: 2, uzura: 1, tama: 1 }, 'beer')).toBe(false);
    expect(orderOk({ gyu: 5, ebi: 5, chz: 1, mochi: 1 }, 'oolong')).toBe(false);
  });
  it('keeps each item between 0 and 5', () => {
    for (let i = 0; i < 7; i++) addItem('gyu', 1);
    expect(yuki.get().order.gyu).toBe(5);
    for (let i = 0; i < 7; i++) addItem('gyu', -1);
    expect(yuki.get().order.gyu).toBe(0);
  });
  it('does not send an order that breaks the rules', () => {
    yuki.set({ step: 'order', drink: 'beer', order: { gyu: 1 } });
    placeOrder();
    expect(yuki.get().step).toBe('order');
    yuki.set({ order: { gyu: 1, uzura: 1, tama: 1, ebi: 1 } });
    placeOrder();
    expect(yuki.get().step).toBe('count');
  });
});

describe('answers', () => {
  it('marks a wrong reply and lets another be tried; a right one ends the step', () => {
    yuki.set({ step: 'drink' });
    pickTalk('drink', 2);
    expect(yuki.get()).toMatchObject({ wrong: [2], picked: null, drink: null });
    pickTalk('drink', 1);
    expect(yuki.get()).toMatchObject({ picked: 1, drink: 'oolong' });
    nextYuki();
    expect(yuki.get()).toMatchObject({ step: 'order', picked: null, wrong: [] });
  });
  it('puts every ordered skewer on the plate once 本 is chosen', () => {
    yuki.set({ step: 'count', order: { gyu: 2, ebi: 1 } });
    pickUnit(1);
    expect(yuki.get().plate).toHaveLength(0);
    pickUnit(0);
    expect(yuki.get().plate.map((k) => k.id)).toEqual(['gyu', 'gyu', 'ebi']);
    expect(yuki.get().said.at(-1)?.jp).toBe('{牛|ぎゅう}かつを2{本|にほん}{頼|たの}んだよ。');
  });
});

describe('eating', () => {
  beforeEach(() =>
    yuki.set({
      step: 'eat',
      plate: [
        { id: 'gyu', bites: 2, dip: false },
        { id: 'ebi', bites: 2, dip: false },
      ],
    }),
  );
  it('takes a bite on a second tap within 500 ms, not on a slow one', () => {
    tapSkewer(0, 1000);
    tapSkewer(0, 1200);
    expect(yuki.get().plate[0]!.bites).toBe(1);
    tapSkewer(1, 2000);
    tapSkewer(1, 2600);
    expect(yuki.get().plate[1]!.bites).toBe(2);
  });
  it('lets Yuki tease a second dip after a bite, then lets it pass', () => {
    dipSkewer(0);
    expect(yuki.get().plate[0]!.dip).toBe(true);
    biteSkewer(0);
    dipSkewer(0);
    expect(yuki.get()).toMatchObject({ warned: 1, tease: true });
    expect(yuki.get().plate[0]!.dip).toBe(false);
    vi.advanceTimersByTime(2300);
    expect(yuki.get().tease).toBe(false);
  });
  it('moves the pick to the next skewer when one is finished', () => {
    biteSkewer(0);
    biteSkewer(0);
    expect(yuki.get().sel).toBe(1);
  });
});

describe('yen read aloud', () => {
  it('follows the sound changes', () => {
    expect(yenKana(1300)).toBe('せんさんびゃくえん');
    expect(yenKana(1860)).toBe('せんはっぴゃくろくじゅうえん');
    expect(yenKana(1610)).toBe('せんろっぴゃくじゅうえん');
    expect(yenKana(2000)).toBe('にせんえん');
  });
});
