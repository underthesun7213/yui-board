/* The fireworks photo (level 8, Kyoto's last scene), outside React like the
   matcha table: the phone's screen on a canvas, a frame dragged and zoomed
   over the picture of Ayano on the bridge, the shutter and its flash. It
   writes each shot's result to the `ph` store; PhotoGame.tsx shows the rest. */
import { ART } from '../content/art';
import { PH_TRIES } from '../content/photo';
import { ph, PH_START } from '../state/photo';
import {
  FIREWORKS,
  PHOTO_ART,
  START,
  centre,
  clampZoom,
  grade,
  isGood,
  view,
  type Box,
  type Pt,
} from './photo-geo';

let cv: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let img: HTMLImageElement | null = null;
let raf = 0;
let mid: Pt = { ...START };
/** after the shutter: the frame stays where it was shot until the next one */
let frozen: Box | null = null;
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
const current = () => frozen ?? view(mid, ph.get().zoom);

function draw(now: number) {
  if (!cv || !ctx) return;
  const c = ctx;
  const w = cv.width;
  const h = cv.height;
  const v = current();
  const k = w / (v.x1 - v.x0);
  c.fillStyle = '#0b1230';
  c.fillRect(0, 0, w, h);
  if (img?.complete && img.naturalWidth) {
    const sx = img.naturalWidth / 900;
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
  /* the camera's guides: thirds and corner marks; none on a shot taken */
  const u = Math.max(1, w / 400);
  if (!frozen) {
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
function frame(now: number) {
  const dt = Math.min(0.05, (now - lastT) / 1000);
  lastT = now;
  if (flash > 0) flash = Math.max(0, flash - dt * 2.2);
  draw(now);
  raf = requestAnimationFrame(frame);
}

/* ---------- the hand: drag to move the frame, wheel to zoom ---------- */
let down: Pt | null = null;
function pointerdown(e: PointerEvent) {
  if (frozen || ph.get().done) return;
  down = { x: e.clientX, y: e.clientY };
  try {
    cv!.setPointerCapture(e.pointerId);
  } catch {
    /* a synthetic pointer */
  }
}
function pointermove(e: PointerEvent) {
  if (!down || !cv) return;
  const v = current();
  const k = (v.x1 - v.x0) / cv.getBoundingClientRect().width;
  /* the picture follows the finger, so the frame moves the other way */
  mid = centre(
    view(
      { x: mid.x - (e.clientX - down.x) * k, y: mid.y - (e.clientY - down.y) * k },
      ph.get().zoom,
    ),
  );
  down = { x: e.clientX, y: e.clientY };
}
function pointerup() {
  down = null;
}
function wheel(e: WheelEvent) {
  if (frozen || ph.get().done) return;
  e.preventDefault();
  zoomTo(ph.get().zoom * (e.deltaY < 0 ? 1.08 : 1 / 1.08));
}

/* ---------- what the screen calls ---------- */
export function attach(canvas: HTMLCanvasElement, good: () => void) {
  cv = canvas;
  ctx = canvas.getContext('2d');
  onGood = good;
  /* a scene not started yet: the phone comes up on the bridge rail */
  if (!ph.get().shots) {
    mid = { ...START };
    frozen = null;
  }
  if (!img) {
    img = new Image();
    img.src = ART[PHOTO_ART] ?? '';
  }
  fit();
  addEventListener('resize', fit);
  canvas.addEventListener('pointerdown', pointerdown);
  canvas.addEventListener('pointermove', pointermove);
  canvas.addEventListener('pointerup', pointerup);
  canvas.addEventListener('pointercancel', pointerup);
  canvas.addEventListener('wheel', wheel, { passive: false });
  lastT = performance.now();
  raf = requestAnimationFrame(frame);
}
export function detach() {
  cancelAnimationFrame(raf);
  removeEventListener('resize', fit);
  if (cv) {
    cv.removeEventListener('pointerdown', pointerdown);
    cv.removeEventListener('pointermove', pointermove);
    cv.removeEventListener('pointerup', pointerup);
    cv.removeEventListener('pointercancel', pointerup);
    cv.removeEventListener('wheel', wheel);
  }
  cv = null;
  ctx = null;
  down = null;
}
/** a fresh scene: the phone comes up on the bridge rail */
export function reset(mode: 'friend' | 'sky') {
  ph.set({ ...PH_START, mode });
  mid = { ...START };
  frozen = null;
  flash = 0;
}
export function zoomTo(z: number) {
  ph.set({ zoom: clampZoom(z) });
  mid = centre(view(mid, ph.get().zoom));
}
/** the shutter: the frame is scored as it stands */
export function shoot() {
  const s = ph.get();
  if (frozen || s.done || s.shots >= PH_TRIES) return;
  frozen = view(mid, s.zoom);
  flash = 1;
  const r = grade(frozen, s.mode);
  const shots = s.shots + 1;
  const good = isGood(r.grade);
  ph.set({ shots, grade: r.grade, n: r.n, done: good || shots >= PH_TRIES });
  if (good && s.mode === 'friend') onGood();
}
/** after a miss: the phone comes back up where it was */
export function again() {
  if (ph.get().done) return;
  frozen = null;
  ph.set({ grade: null });
}
/** e2e: the frame put here, at this zoom, and shot */
export function settleShot(x: number, y: number, zoom: number) {
  frozen = null;
  ph.set({ zoom: clampZoom(zoom) });
  mid = centre(view({ x, y }, zoom));
  shoot();
}
