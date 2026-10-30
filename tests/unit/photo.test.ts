import { beforeEach, describe, expect, it } from 'vitest';
import {
  FACE,
  FIREWORKS,
  IMG,
  PH_ZOOM,
  grade,
  inFrame,
  isGood,
  view,
} from '../../src/minigames/photo-geo';
import { reset, shoot, again, settleShot } from '../../src/minigames/photo';
import { ph } from '../../src/state/photo';

/* The fireworks photo: the frame, what it holds, and the three shots */
describe('photo game', () => {
  beforeEach(() => reset('friend'));

  it('keeps the frame inside the picture at 4:3', () => {
    for (const z of [PH_ZOOM[0], 2, PH_ZOOM[1], 9]) {
      const v = view({ x: -500, y: 5000 }, z);
      expect(v.x0).toBe(0);
      expect(v.y1).toBeCloseTo(IMG.h);
      expect((v.y1 - v.y0) / (v.x1 - v.x0)).toBeCloseTo(3 / 4);
    }
  });

  it('places her face and the fireworks inside the picture', () => {
    expect(FACE.x1).toBeLessThan(IMG.w);
    for (const f of FIREWORKS) expect(f.x < IMG.w && f.y < IMG.h).toBe(true);
  });

  it('starts away from her face and from the fireworks', () => {
    const v = view({ x: 640, y: 880 }, 2.6);
    expect(grade(v, 'friend').grade).toBe('face');
    expect(inFrame(v)).toBe(0);
  });

  it('grades a shot by her face first, then the fireworks', () => {
    /* zoomed out over the sky: her face and most of the fireworks */
    const wide = view({ x: 450, y: 260 }, PH_ZOOM[0]);
    expect(grade(wide, 'friend').grade).toBe('best');
    /* close on her face: one firework at most */
    const close = view({ x: 485, y: 200 }, PH_ZOOM[1]);
    expect(['few', 'good']).toContain(grade(close, 'friend').grade);
    /* the sky only: her face does not matter */
    const sky = view({ x: 200, y: 250 }, 2);
    expect(grade(sky, 'friend').grade).toBe('face');
    expect(grade(sky, 'sky').grade).toBe('skyGood');
    expect(isGood('few')).toBe(false);
  });

  it('allows three shots, and ends at a good one', () => {
    shoot();
    expect(ph.get()).toMatchObject({ shots: 1, grade: 'face', done: false });
    again();
    shoot();
    again();
    shoot();
    expect(ph.get()).toMatchObject({ shots: 3, done: true });
    reset('friend');
    settleShot(450, 260, PH_ZOOM[0]);
    expect(ph.get()).toMatchObject({ shots: 1, grade: 'best', done: true });
  });
});
