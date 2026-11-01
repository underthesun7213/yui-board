/* The fireworks photo (level 8, Kyoto's last scene), outside React like the
   matcha table: the phone's screen on a canvas, a frame swinging over the
   picture of Ayano on the bridge, first up and down, then side to side, with a
   gauge for each drawn on the screen's edges; a stop on each, the shutter and
   its flash. It writes each stop and shot to the `ph` store; PhotoGame.tsx
   shows the rest. */
import { ART } from '../content/art';
import { PH_TRIES, type PhMode } from '../content/photo';
import { ph, PH_START } from '../state/photo';
import {
  FIREWORKS,
  GOOD,
  GREAT,
  IMG,
  PHOTO_ART,
  frameAt,
  grade,
  isGood,
  pace,
  swing,
  zone,
} from './photo-geo';

/** how fast each swing runs on average: gauge phase per second (4 is one round trip) */
const SPEED = { v: 1.1, h: 1.3 };

let cv: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let img: HTMLImageElement | null = null;
let raf = 0;
/** the swings' phases and gauge values */
let tv = 0;
let th = 0;
let gv = 0;
let gh = 0;
/** after the shutter: the frame stays where it was shot until the next one */
let frozen = false;
let flash = 0;
let lastT = 0;
let onGood: () => void = () => {};

function fit() {
  if (!cv) return;
  const r = cv.getBoundingClientRect();
  const d = Math.min(2, devicePixelRatio || 1);
  cv.width = Math.max(1, Math.round(r.width * d));
  cv.height = Math.max(1, Math.round(r.height * d));
}

/* the gauge: bad / good / great / good / bad, along one edge of the screen */
const ZONES: [number, number, string][] = [
  [-1, -GOOD, '#e07a8a'],
  [-GOOD, -GREAT, '#7fd6a1'],
  [-GREAT, GREAT, '#f2c35b'],
  [GREAT, GOOD, '#7fd6a1'],
  [GOOD, 1, '#e07a8a'],
];
function gauge(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  len: number,
  thick: number,
  upright: boolean,
  m: number,
  live: boolean,
) {
  c.save();
  c.globalAlpha = live ? 0.9 : 0.35;
  for (const [a, b, col] of ZONES) {
    c.fillStyle = col;
    const p0 = ((a + 1) / 2) * len;
    const p1 = ((b + 1) / 2) * len;
    if (upright) c.fillRect(x, y + p0, thick, p1 - p0);
    else c.fillRect(x + p0, y, p1 - p0, thick);
  }
  c.globalAlpha = 1;
  const p = ((m + 1) / 2) * len;
  c.fillStyle = '#fff';
  c.strokeStyle = '#0b1230';
  c.lineWidth = thick / 6;
  const k = thick / 3;
  if (upright) {
    c.fillRect(x - k, y + p - k, thick + 2 * k, 2 * k);
    c.strokeRect(x - k, y + p - k, thick + 2 * k, 2 * k);
  } else {
    c.fillRect(x + p - k, y - k, 2 * k, thick + 2 * k);
    c.strokeRect(x + p - k, y - k, 2 * k, thick + 2 * k);
  }
  c.restore();
}

function draw(now: number) {
  if (!cv || !ctx) return;
  const c = ctx;
  const w = cv.width;
  const h = cv.height;
  const s = ph.get();
  const v = frameAt(s.mode, gv, s.step === 'v' ? 0 : gh);
  const k = w / (v.x1 - v.x0);
  c.fillStyle = '#0b1230';
  c.fillRect(0, 0, w, h);
  if (img?.complete && img.naturalWidth) {
    const sx = img.naturalWidth / IMG.w;
    c.drawImage(img, v.x0 * sx, v.y0 * sx, (v.x1 - v.x0) * sx, (v.y1 - v.y0) * sx, 0, 0, w, h);
  }
  /* the fireworks in the frame shimmer a little: they are live */
  c.save();
  c.globalCompositeOperation = 'lighter';
  FIREWORKS.forEach((f, i) => {
    const a = 0.1 + 0.08 * Math.sin(now / 260 + i * 1.7);
    const x = (f.x - v.x0) * k;
    const y = (f.y - v.y0) * k;
    const r = f.r * k * 0.9;
    if (x < -r || y < -r || x > w + r || y > h + r) return;
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(255,240,210,${a})`);
    g.addColorStop(1, 'rgba(255,240,210,0)');
    c.fillStyle = g;
    c.fillRect(x - r, y - r, r * 2, r * 2);
  });
  c.restore();
  const u = Math.max(1, w / 400);
  if (!frozen) {
    /* the camera's guides: thirds and corner marks */
    c.strokeStyle = 'rgba(255,255,255,0.35)';
    c.lineWidth = u;
    c.beginPath();
    for (const t of [1 / 3, 2 / 3]) {
      c.moveTo(w * t, 0);
      c.lineTo(w * t, h);
      c.moveTo(0, h * t);
      c.lineTo(w, h * t);
    }
    c.stroke();
    c.strokeStyle = '#fff';
    c.lineWidth = u * 2.5;
    const m = 14 * u;
    const l = 26 * u;
    c.beginPath();
    for (const [x, y, dx, dy] of [
      [m, m, 1, 1],
      [w - m, m, -1, 1],
      [m, h - m, 1, -1],
      [w - m, h - m, -1, -1],
    ] as const) {
      c.moveTo(x, y + dy * l);
      c.lineTo(x, y);
      c.lineTo(x + dx * l, y);
    }
    c.stroke();
    /* the two gauges: up and down on the right edge, side to side along the foot */
    const t = 12 * u;
    const pad = 10 * u;
    gauge(c, w - pad - t, pad * 4, h - pad * 8, t, true, gv, s.step === 'v');
    gauge(c, pad * 4, h - pad - t, w - pad * 8 - t, t, false, gh, s.step === 'h');
  } else {
    c.strokeStyle = '#fff';
    c.lineWidth = u * 6;
    c.strokeRect(0, 0, w, h);
  }
  if (flash > 0) {
    c.fillStyle = `rgba(255,255,255,${flash})`;
    c.fillRect(0, 0, w, h);
  }
}
/** the running swing moved on by dt seconds */
function advance(dt: number) {
  if (frozen || ph.get().done) return;
  if (ph.get().step === 'v') gv = swing((tv += dt * SPEED.v * pace(gv)));
  else gh = swing((th += dt * SPEED.h * pace(gh)));
}
function frame(now: number) {
  const dt = Math.min(0.05, Math.max(0, now - lastT) / 1000);
  lastT = now;
  advance(dt);
  if (flash > 0) flash = Math.max(0, flash - dt * 2.2);
  draw(now);
  raf = requestAnimationFrame(frame);
}

/** a fresh swing: from a random place, so no two shots time the same */
function swingAgain() {
  tv = Math.random() * 4;
  th = Math.random() * 4;
  gv = swing(tv);
  gh = 0;
  frozen = false;
}

/* ---------- what the screen calls ---------- */
export function attach(canvas: HTMLCanvasElement, good: () => void) {
  cv = canvas;
  ctx = canvas.getContext('2d');
  onGood = good;
  /* a scene not started yet: the phone comes up swinging */
  if (!ph.get().shots && ph.get().step === 'v') swingAgain();
  if (!img) {
    img = new Image();
    img.src = ART[PHOTO_ART] ?? '';
  }
  fit();
  addEventListener('resize', fit);
  lastT = performance.now();
  raf = requestAnimationFrame(frame);
}
export function detach() {
  cancelAnimationFrame(raf);
  removeEventListener('resize', fit);
  cv = null;
  ctx = null;
}
/** a fresh scene */
export function reset(mode: PhMode) {
  ph.set({ ...PH_START, mode });
  swingAgain();
  flash = 0;
}
/** a stop: the first holds the up-and-down swing, the second is the shutter */
/* A stop counts where the gauge was the moment the finger touched the
   button (as in a rhythm game), though the button acts on its click, which
   every phone sends: the press marks the gauge, moved on from the last drawn
   frame to the touch's own time, and the click that follows uses that mark.
   Only the button stops the swing: a tap on the screen does nothing, so a
   hand that brushes the photo does not take it. */
let marked: { g: number; at: number } | null = null;
export function mark(at: number) {
  const s = ph.get();
  if (frozen || s.done) return;
  if (at > lastT) {
    advance(Math.min(0.05, (at - lastT) / 1000));
    lastT = at;
  }
  marked = { g: s.step === 'v' ? gv : gh, at: performance.now() };
}
export function stop() {
  const s = ph.get();
  if (frozen || s.done || s.shots >= PH_TRIES) return;
  /* a press of the button a moment ago: the gauge as it was then */
  if (marked && performance.now() - marked.at < 1000) {
    if (s.step === 'v') gv = marked.g;
    else gh = marked.g;
  }
  marked = null;
  if (s.step === 'v') {
    ph.set({ step: 'h', zv: zone(gv) });
    return;
  }
  frozen = true;
  flash = 1;
  const g = grade(s.mode, gv, gh);
  const shots = s.shots + 1;
  const good = isGood(g);
  ph.set({ zh: zone(gh), shots, grade: g, done: good || shots >= PH_TRIES });
  if (good && s.mode === 'friend') onGood();
}
/** after a miss: the phone comes back up, swinging again */
export function again() {
  if (ph.get().done) return;
  swingAgain();
  ph.set({ step: 'v', zv: null, zh: null, grade: null });
}
/** e2e and tests: both swings stopped at these gauge values */
export function settleShot(v: number, h: number) {
  swingAgain();
  ph.set({ step: 'v', zv: null, zh: null, grade: null });
  gv = v;
  stop();
  gh = h;
  stop();
}
