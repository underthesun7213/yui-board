/* The fireworks photo: where things are in the picture and how a shot is
   scored. Pure numbers in the picture's own pixels
   (src/art/minigames/ayano/hanabi.jpg, 900 × 1200), so the unit tests run
   without a canvas. */
import type { PhGrade, PhMode } from '../content/photo';

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
export const IMG = { w: 900, h: 1200 };
/** the phone is held sideways: the frame is 4:3 */
export const ASPECT = 3 / 4;
/** zoom: how many frames fit across the picture */
export const PH_ZOOM: [number, number] = [1.3, 3];
/** where the frame starts: zoomed in on the bridge rail, away from both */
export const START: Pt = { x: 640, y: 880 };

/** Ayano's face, hair and hair ornament: a shot must hold all of it */
export const FACE: Box = { x0: 395, y0: 115, x1: 575, y1: 275 };
/** the fireworks drawn in the picture: a shot holds one when it holds its middle */
export const FIREWORKS: (Pt & { r: number })[] = [
  { x: 225, y: 105, r: 130 },
  { x: 50, y: 220, r: 75 },
  { x: 65, y: 360, r: 75 },
  { x: 178, y: 305, r: 38 },
  { x: 312, y: 290, r: 75 },
  { x: 648, y: 232, r: 62 },
  { x: 740, y: 105, r: 95 },
];

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
export const clampZoom = (z: number) => clamp(z, PH_ZOOM[0], PH_ZOOM[1]);

/** the frame around a middle at a zoom, kept inside the picture */
export function view(c: Pt, zoom: number): Box {
  const w = IMG.w / clampZoom(zoom);
  const h = w * ASPECT;
  const x0 = clamp(c.x - w / 2, 0, IMG.w - w);
  const y0 = clamp(c.y - h / 2, 0, IMG.h - h);
  return { x0, y0, x1: x0 + w, y1: y0 + h };
}
/** the middle of that frame: a middle dragged off the edge comes back */
export const centre = (v: Box): Pt => ({ x: (v.x0 + v.x1) / 2, y: (v.y0 + v.y1) / 2 });

const holds = (v: Box, p: Pt) => p.x >= v.x0 && p.x <= v.x1 && p.y >= v.y0 && p.y <= v.y1;
const holdsBox = (v: Box, b: Box) => b.x0 >= v.x0 && b.x1 <= v.x1 && b.y0 >= v.y0 && b.y1 <= v.y1;

/** the fireworks a frame holds */
export const inFrame = (v: Box) => FIREWORKS.filter((f) => holds(v, f)).length;

/* A shot of Ayano needs her whole face; then three fireworks make it perfect
   and two good. A shot of the sky needs three fireworks; Ayano does not count. */
export function grade(v: Box, mode: PhMode): { grade: PhGrade; n: number } {
  const n = inFrame(v);
  if (mode === 'sky') return { grade: n >= 3 ? 'skyGood' : 'skyFew', n };
  if (!holdsBox(v, FACE)) return { grade: 'face', n };
  return { grade: n >= 3 ? 'best' : n >= 2 ? 'good' : 'few', n };
}
/** a shot that counts: Ayano's picture is earned only with her in it */
export const isGood = (g: PhGrade) => g === 'best' || g === 'good' || g === 'skyGood';
