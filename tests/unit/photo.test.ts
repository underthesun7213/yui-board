import { beforeEach, describe, expect, it } from 'vitest';
import {
  BODY,
  FACE,
  FIREWORKS,
  GOOD,
  GREAT,
  IMG,
  SHOTS,
  frameAt,
  grade,
  isGood,
  pace,
  swing,
  zone,
} from '../../src/minigames/photo-geo';
import { again, reset, settleShot, stop } from '../../src/minigames/photo';
import { ph } from '../../src/state/photo';

const holds = (v: { x0: number; y0: number; x1: number; y1: number }, b: typeof BODY) =>
  b.x0 >= v.x0 && b.x1 <= v.x1 && b.y0 >= v.y0 && b.y1 <= v.y1;
const overlaps = (v: { x0: number; y0: number; x1: number; y1: number }, b: typeof BODY) =>
  b.x0 < v.x1 && b.x1 > v.x0 && b.y0 < v.y1 && b.y1 > v.y0;

/* The fireworks photo: two swings stopped on gauges, and the three shots */
describe('photo game', () => {
  beforeEach(() => reset('friend'));

  it('keeps every frame inside the picture, at the swings’ ends too', () => {
    for (const mode of ['friend', 'sky'] as const)
      for (const v of [-1, 0, 1])
        for (const h of [-1, 0, 1]) {
          const f = frameAt(mode, v, h);
          expect(f.x0).toBeGreaterThanOrEqual(0);
          expect(f.y0).toBeGreaterThanOrEqual(0);
          expect(f.x1).toBeLessThanOrEqual(IMG.w);
          expect(f.y1).toBeLessThanOrEqual(IMG.h);
        }
    for (const f of FIREWORKS) expect(f.x < IMG.w && f.y < IMG.h).toBe(true);
  });

  it('holds all of her at a good stop, and cuts her at a bad one', () => {
    for (const v of [-GOOD, 0, GOOD])
      for (const h of [-GOOD, 0, GOOD]) expect(holds(frameAt('friend', v, h), BODY)).toBe(true);
    /* too high: the feet go; too low: the face goes */
    expect(frameAt('friend', -1, 0).y1).toBeLessThan(BODY.y1);
    expect(frameAt('friend', 1, 0).y0).toBeGreaterThan(FACE.y0);
  });

  it('never puts her in a shot of the sky', () => {
    for (const v of [-1, 0, 1])
      for (const h of [-1, 0, 1]) expect(overlaps(frameAt('sky', v, h), BODY)).toBe(false);
    expect(SHOTS.sky.w / SHOTS.sky.h).toBeCloseTo(4 / 3);
    expect(SHOTS.friend.w / SHOTS.friend.h).toBeCloseTo(3 / 4);
  });

  it('swings evenly between the two ends', () => {
    expect([0, 1, 2, 3, 4].map(swing)).toEqual([0, 1, 0, -1, 0]);
    expect(swing(0.5)).toBeCloseTo(0.5);
    expect(swing(-1)).toBeCloseTo(-1);
  });

  it('speeds up toward the great middle and slows at the ends', () => {
    expect(pace(0)).toBeGreaterThan(pace(GOOD));
    expect(pace(GOOD)).toBeGreaterThan(pace(1));
    expect(pace(0) / pace(1)).toBeCloseTo(1.45 / 0.55);
    /* the average across the gauge stays the swing's set speed */
    let sum = 0;
    for (let i = 0; i <= 200; i++) sum += pace(-1 + i / 100);
    expect(sum / 201).toBeCloseTo(1, 1);
  });

  it('reads the gauge: great in the middle, then good, then bad', () => {
    expect(zone(0)).toBe('great');
    expect(zone(-GREAT)).toBe('great');
    expect(zone(GREAT + 0.01)).toBe('good');
    expect(zone(-GOOD)).toBe('good');
    expect(zone(GOOD + 0.01)).toBe('bad');
    expect(zone(-1)).toBe('bad');
  });

  it('grades a shot of her by both stops, and the sky by staying steady', () => {
    expect(grade('friend', 0, 0)).toBe('best');
    expect(grade('friend', 0.3, 0)).toBe('good');
    expect(grade('friend', -0.8, 0)).toBe('feet');
    expect(grade('friend', 0.8, 0)).toBe('face');
    expect(grade('friend', 0, 0.9)).toBe('side');
    expect(grade('sky', 0.3, -0.3)).toBe('skyGood');
    expect(grade('sky', 0, 0.9)).toBe('skyMiss');
    expect(isGood('side')).toBe(false);
    expect(isGood('skyGood')).toBe(true);
  });

  it('stops up and down first, then side to side with the shutter', () => {
    expect(ph.get()).toMatchObject({ step: 'v', zv: null });
    stop();
    expect(ph.get()).toMatchObject({ step: 'h', shots: 0 });
    expect(ph.get().zv).not.toBeNull();
    stop();
    expect(ph.get().shots).toBe(1);
    expect(ph.get().zh).not.toBeNull();
  });

  it('allows three shots, and ends at a good one', () => {
    settleShot(1, 0);
    expect(ph.get()).toMatchObject({
      shots: 1,
      grade: 'face',
      zv: 'bad',
      zh: 'great',
      done: false,
    });
    again();
    expect(ph.get()).toMatchObject({ step: 'v', zv: null, grade: null });
    settleShot(-1, 0);
    settleShot(0, 1);
    expect(ph.get()).toMatchObject({ shots: 3, grade: 'side', done: true });
    reset('friend');
    settleShot(0, 0.05);
    expect(ph.get()).toMatchObject({ shots: 1, grade: 'best', done: true });
  });
});
