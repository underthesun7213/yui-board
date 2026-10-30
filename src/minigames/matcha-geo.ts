/* The matcha table's layout and the lines the player follows (아야노 미니게임,
   level 8, Kyoto scene 5). Pure numbers in the table's 800 × 600 units, so the
   scoring can be tested without a canvas. */
export interface Pt {
  x: number;
  y: number;
}
export const W = 800;
export const H = 600;
export const BOWL = { x: 300, y: 365, r: 150, ri: 124 };
export const CUP = { x: 612, y: 380, r: 100, ri: 87, saucer: 134 };
export type Vessel = 'bowl' | 'cup';
export const VESSEL = { bowl: BOWL, cup: CUP };
/** where each tool rests on the tray, and how far it reaches */
export const SPOT = {
  chasen: { x: 100, y: 500, r: 50 },
  chashaku: { x: 335, y: 82, r: 26 },
  natsume: { x: 105, y: 125, r: 52 },
  yuzamashi: { x: 700, y: 110, r: 52 },
  pitcher: { x: 545, y: 105, r: 46 },
  chawan: { x: BOWL.x, y: BOWL.y, r: BOWL.r },
  cup: { x: CUP.x, y: CUP.y, r: CUP.saucer },
};
export type Spot = keyof typeof SPOT;

export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const easeOut = (t: number) => 1 - (1 - t) ** 3;
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/** the tool under a tap, the long scoop first */
export function hitTool(p: Pt, pad = 0): Spot | null {
  const s = SPOT.chashaku;
  if (Math.abs(p.y - s.y) < 22 + pad && Math.abs(p.x - s.x) < 95 + pad) return 'chashaku';
  for (const k of ['natsume', 'chasen', 'yuzamashi', 'pitcher', 'cup', 'chawan'] as const) {
    const t = SPOT[k];
    if (Math.hypot(p.x - t.x, p.y - t.y) < t.r + pad) return k;
  }
  return null;
}
export const inVessel = (p: Pt, v: Vessel) =>
  Math.hypot(p.x - VESSEL[v].x, p.y - VESSEL[v].y) < VESSEL[v].ri;

/** the W to whisk along, spread across the vessel from left to right */
export function wPath(v: Vessel): Pt[] {
  const t = VESSEL[v];
  const k = t.ri * 0.72;
  return (
    [
      [-1, -0.55],
      [-0.5, 0.6],
      [0, -0.25],
      [0.5, 0.6],
      [1, -0.55],
    ] as const
  ).map(([a, b]) => ({ x: t.x + a * k, y: t.y + b * k }));
}
/** how far a point is from a polyline */
export function distToPath(p: Pt, pts: Pt[]) {
  let best = Infinity;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1]!;
    const b = pts[i]!;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const t = clamp(((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy || 1), 0, 1);
    best = Math.min(best, Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy));
  }
  return best;
}

/* the latte heart's dashed line: a spiral out from the middle of the cup
   that ends straight below it, then one line up through the middle and past
   the top. ART.n points of spiral, then the pull-through. */
export const ART = { R: 56, turns: 1.75, n: 72 };
export function artPath(): Pt[] {
  const pts: Pt[] = [];
  const { R, turns, n } = ART;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const a = Math.PI / 2 - turns * Math.PI * 2 * (1 - t);
    const r = 5 + (R - 5) * t;
    pts.push({ x: CUP.x + Math.cos(a) * r, y: CUP.y + Math.sin(a) * r });
  }
  for (let k = 1; k <= 6; k++) pts.push({ x: CUP.x, y: CUP.y + R - ((2 * R + 18) * k) / 6 });
  return pts;
}

/** a curve from a to b, lifted in the middle: the way a tool is carried */
export function arc(a: Pt, b: Pt, lift = 60, n = 16): Pt[] {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2 - lift;
  const pts: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    pts.push({
      x: (1 - t) ** 2 * a.x + 2 * t * (1 - t) * mx + t * t * b.x,
      y: (1 - t) ** 2 * a.y + 2 * t * (1 - t) * my + t * t * b.y,
    });
  }
  return pts;
}
/** the point k (0…1) of the way along a polyline */
export function along(pts: Pt[], k: number): Pt {
  const L: number[] = [];
  let tot = 0;
  for (let i = 1; i < pts.length; i++) {
    tot += Math.hypot(pts[i]!.x - pts[i - 1]!.x, pts[i]!.y - pts[i - 1]!.y);
    L.push(tot);
  }
  const want = k * tot;
  let i = L.findIndex((l) => l >= want);
  if (i < 0) i = L.length - 1;
  const l0 = i ? L[i - 1]! : 0;
  const t = (want - l0) / (L[i]! - l0 || 1);
  return { x: lerp(pts[i]!.x, pts[i + 1]!.x, t), y: lerp(pts[i]!.y, pts[i + 1]!.y, t) };
}

/* Scoring a traced line, the whisk's W and the latte's spiral alike: the
   share of the hand's travel that stayed near the line. */
export interface Trace {
  hit: number;
  miss: number;
}
export function traceStep(t: Trace, near: boolean, dist: number) {
  if (near) t.hit += dist;
  else t.miss += dist;
}
export const accuracy = (t: Trace) => (t.hit + t.miss ? t.hit / (t.hit + t.miss) : 1);

/** how the whisking went, from its accuracy */
export const whiskGrade = (acc: number) =>
  acc >= 0.85 ? 'whiskBest' : acc >= 0.65 ? 'whiskGood' : 'whiskLively';
/** the latte: a heart at 60 % and over, a clean one at 85 % */
export const artGrade = (acc: number) =>
  acc >= 0.85 ? 'artBest' : acc >= 0.6 ? 'artGood' : 'artMiss';
/** two scoops is right; fewer is thin, more is too strong */
export const powderGrade = (n: number) =>
  n === 2 ? 'powderOk' : n < 2 ? 'powderThin' : 'powderStrong';
