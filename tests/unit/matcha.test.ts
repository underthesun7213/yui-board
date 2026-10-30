import { beforeEach, describe, expect, it } from 'vitest';
import { pickReply } from '../../src/actions/matcha';
import { MT_FB, MT_OPTS } from '../../src/content/matcha';
import {
  ART,
  CUP,
  accuracy,
  artGrade,
  artPath,
  distToPath,
  hitTool,
  powderGrade,
  traceStep,
  wPath,
  whiskGrade,
} from '../../src/minigames/matcha-geo';
import { mt, MT_START } from '../../src/state/matcha';

/* 아야노 미니게임: the lines to follow, the scoring and the replies */
describe('matcha mini-game', () => {
  beforeEach(() => mt.set(MT_START));

  it('lays the latte line from the middle of the cup out and up past the top', () => {
    const pts = artPath();
    expect(pts).toHaveLength(ART.n + 1 + 6);
    expect(Math.hypot(pts[0]!.x - CUP.x, pts[0]!.y - CUP.y)).toBeLessThan(6);
    /* the spiral ends straight below the middle, the line ends above the circle */
    expect(pts[ART.n]!.x).toBeCloseTo(CUP.x);
    expect(pts[ART.n]!.y).toBeCloseTo(CUP.y + ART.R);
    expect(pts[pts.length - 1]!.y).toBeLessThan(CUP.y - ART.R);
    /* the whole line stays inside the cup */
    for (const p of pts) expect(Math.hypot(p.x - CUP.x, p.y - CUP.y)).toBeLessThan(CUP.ri);
  });

  it('measures how far a point is from the W', () => {
    const w = wPath('bowl');
    expect(distToPath(w[2]!, w)).toBe(0);
    expect(distToPath({ x: w[2]!.x, y: w[2]!.y - 30 }, w)).toBeGreaterThan(10);
  });

  it('scores a trace by the share of travel near the line', () => {
    const t = { hit: 0, miss: 0 };
    expect(accuracy(t)).toBe(1);
    traceStep(t, true, 90);
    traceStep(t, false, 10);
    expect(accuracy(t)).toBeCloseTo(0.9);
    expect(whiskGrade(0.9)).toBe('whiskBest');
    expect(whiskGrade(0.7)).toBe('whiskGood');
    expect(whiskGrade(0.5)).toBe('whiskLively');
    expect(artGrade(0.86)).toBe('artBest');
    expect(artGrade(0.6)).toBe('artGood');
    expect(artGrade(0.59)).toBe('artMiss');
    expect([0, 1, 2, 3].map(powderGrade)).toEqual([
      'powderThin',
      'powderThin',
      'powderOk',
      'powderStrong',
    ]);
  });

  it('finds the tool under a tap, the long scoop by its whole length', () => {
    expect(hitTool({ x: 100, y: 500 })).toBe('chasen');
    expect(hitTool({ x: 260, y: 84 })).toBe('chashaku');
    expect(hitTool({ x: 620, y: 380 })).toBe('cup');
    expect(hitTool({ x: 760, y: 560 })).toBe(null);
  });

  it('marks a wrong reply and keeps a right one for the list at the end', () => {
    const wrong = MT_OPTS.intro.findIndex((o) => !o.ok);
    const right = MT_OPTS.intro.findIndex((o) => o.ok);
    pickReply('intro', wrong);
    expect(mt.get()).toMatchObject({ wrong: [wrong], picked: null, done: false });
    pickReply('intro', right);
    expect(mt.get()).toMatchObject({ picked: right, done: true });
    expect(mt.get().said.map((x) => x.jp)).toEqual([MT_OPTS.intro[right]!.jp]);
    pickReply('intro', wrong);
    expect(mt.get().wrong).toEqual([wrong]);
  });

  it('marks every heading as explaining, right or a miss', () => {
    for (const e of Object.values(MT_FB)) {
      const mark = e.head.en[0]!;
      const marked = '○×△'.includes(mark);
      for (const s of [e.head.ja, e.head.ko]) expect('○×△'.includes(s[0]!)).toBe(marked);
      if (marked) expect([e.head.ja[0], e.head.ko[0]]).toEqual([mark, mark]);
    }
  });
});
