/* The fireworks photo: where things are in the picture and how a shot is
   scored. Pure numbers in the picture's own pixels
   (src/art/minigames/ayano/hanabi.jpg, 1200 × 2197: the new sky above, the
   owner's picture, more bridge floor below), so the unit tests run without a
   canvas. */
import type { PhGrade, PhMode, PhZone } from '../content/photo';

export interface Box {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}
export interface Pt {
  x: number;
  y: number;
}

/** the picture's art slot */
export const PHOTO_ART = 'minigames/ayano/hanabi';
export const IMG = { w: 1200, h: 2197 };

/* The phone swings on its own, first up and down, then side to side; each
   swing is stopped on a gauge. A gauge value runs from -1 to 1; 0 is the
   perfect frame, and ±1 the farthest the frame swings (amp, in pixels). */
export interface Shot {
  /** the frame's size: upright for her head to toe, sideways for the sky */
  w: number;
  h: number;
  /** the perfect frame's top left corner */
  x0: number;
  y0: number;
  /** how far the frame swings each way */
  ax: number;
  ay: number;
}
export const SHOTS: Record<PhMode, Shot> = {
  /* her head to her sandals, the fireworks around her and above; a good stop
     still holds all of her, a bad one cuts her feet or her face */
  friend: { w: 975, h: 1300, x0: 112, y0: 560, ax: 112, ay: 215 },
  /* the sky over her head, never her: the frame's foot stays above her hair */
  sky: { w: 640, h: 480, x0: 280, y0: 92, ax: 280, ay: 92 },
};
/** the gauge: within GREAT of the middle is great, within GOOD good, else bad */
export const GREAT = 0.12;
export const GOOD = 0.45;

/** Ayano from the top of her hair to her sandals, and her face with the hair ornament */
export const BODY: Box = { x0: 420, y0: 665, x1: 700, y1: 1762 };
export const FACE: Box = { x0: 502, y0: 669, x1: 691, y1: 837 };
/** the fireworks drawn in the picture: they shimmer in the phone's screen */
export const FIREWORKS: (Pt & { r: number })[] = [
  { x: 72, y: 136, r: 94 },
  { x: 219, y: 236, r: 79 },
  { x: 35, y: 346, r: 100 },
  { x: 104, y: 483, r: 31 },
  { x: 251, y: 388, r: 84 },
  { x: 373, y: 336, r: 37 },
  { x: 424, y: 147, r: 142 },
  { x: 523, y: 310, r: 84 },
  { x: 618, y: 105, r: 37 },
  { x: 775, y: 100, r: 94 },
  { x: 665, y: 236, r: 79 },
  { x: 859, y: 268, r: 105 },
  { x: 712, y: 404, r: 94 },
  { x: 836, y: 483, r: 42 },
  { x: 1053, y: 126, r: 121 },
  { x: 990, y: 283, r: 26 },
  { x: 1106, y: 299, r: 89 },
  { x: 980, y: 414, r: 94 },
  { x: 325, y: 659, r: 136 },
  { x: 141, y: 780, r: 79 },
  { x: 157, y: 926, r: 79 },
  { x: 276, y: 869, r: 40 },
  { x: 416, y: 853, r: 79 },
  { x: 769, y: 792, r: 65 },
  { x: 865, y: 659, r: 100 },
];

/** the frame for a mode at gauge values v (up and down) and h (side to side) */
export function frameAt(mode: PhMode, v: number, h: number): Box {
  const s = SHOTS[mode];
  const x0 = s.x0 + s.ax * h;
  const y0 = s.y0 + s.ay * v;
  return { x0, y0, x1: x0 + s.w, y1: y0 + s.h };
}
/** a swing that keeps going at a steady speed: the gauge value at phase t (4 per round trip) */
export function swing(t: number): number {
  const p = ((t % 4) + 4) % 4;
  return p < 1 ? p : p < 3 ? 2 - p : p - 4;
}
/** the swing's speed at gauge value m, against its average: slow at the ends,
    quickest through the great middle (2.6 times the ends), so the middle is
    hard to catch; averages 1 across the gauge */
export const pace = (m: number) => 0.55 + 0.9 * (1 - Math.abs(m));
/** where a gauge was stopped */
export function zone(m: number): PhZone {
  const a = Math.abs(m);
  return a <= GREAT ? 'great' : a <= GOOD ? 'good' : 'bad';
}

/* A shot of Ayano: too high cuts her feet, too low her face, too far to a
   side leaves her off to it; two greats make it perfect, anything else good.
   A shot of the sky only has to be steady. */
export function grade(mode: PhMode, v: number, h: number): PhGrade {
  const zv = zone(v);
  const zh = zone(h);
  if (mode === 'sky') return zv === 'bad' || zh === 'bad' ? 'skyMiss' : 'skyGood';
  if (zv === 'bad') return v < 0 ? 'feet' : 'face';
  if (zh === 'bad') return 'side';
  return zv === 'great' && zh === 'great' ? 'best' : 'good';
}
/** a shot that counts: Ayano's picture is earned only with her in it */
export const isGood = (g: PhGrade) => g === 'best' || g === 'good' || g === 'skyGood';
