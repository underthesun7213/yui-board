/* Drawing the matcha table (아야노 미니게임) on a canvas, seen from above: the
   tray, the tools, the bowl and the latte cup, the tool in the hand, and the
   dashed lines to follow. It only reads the table state it is given;
   minigames/matcha.ts runs the game. Prototype: docs/06-design/minigames/ayano-matcha. */
import {
  ART,
  BOWL,
  CUP,
  H,
  SPOT,
  W,
  along,
  artPath,
  clamp,
  easeInOut,
  easeOut,
  lerp,
  wPath,
  type Pt,
  type Spot,
  type Vessel,
} from './matcha-geo';

export interface Pile {
  x: number;
  y: number;
  s: number;
  k: number;
}
export interface Tea {
  piles: Pile[];
  water: number;
  foam: number;
  acc: number;
  /** cup only: milk 0…0.8, the art's white circle, the pull-through, the heart */
  milk: number;
  dot: number;
  cut: Pt[] | null;
  art: { off: number } | null;
}
export const freshTea = (): Tea => ({
  piles: [],
  water: 0,
  foam: 0,
  acc: 1,
  milk: 0,
  dot: 0,
  cut: null,
  art: null,
});
export type Held = 'chashaku' | 'chasen' | 'yuzamashi' | 'pitcher';
export interface Drag extends Pt {
  tool: Held;
  /** a pitcher held high, low, or pulling through */
  style?: 'high' | 'low' | 'cut';
  pouring?: boolean;
  /** the scoop is in the caddy, and carries powder */
  dig?: boolean;
  loaded?: boolean;
}
export interface Demo {
  pts: Pt[];
  t0: number;
  ms: number;
  every: number;
  keep: boolean;
}
export interface Table {
  arrive: number;
  bowl: Tea;
  cup: Tea;
  lid: number;
  drag: Drag | null;
  /** the tool that can be picked up now, ringed until the first grab */
  hint: Held | null;
  labels: Set<Spot>;
  mark: { k: Spot; ok: boolean } | null;
  /** the quiz waits for a tap: every tool is ringed */
  quiz: boolean;
  /** the scoop flying caddy → cup on its own (the latte base) */
  scoop: number | null;
  whisk: Vessel | null;
  /** the latte's dashed spiral is up */
  trace: boolean;
  demo: Demo | null;
}

let g: CanvasRenderingContext2D;

/* a fixed scatter, so bubbles and clumps don't jump between frames */
let seed = 7;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const SCATTER = Array.from({ length: 220 }, () => ({
  a: rnd() * Math.PI * 2,
  r: Math.sqrt(rnd()),
  s: rnd(),
}));

function mix(c1: string, c2: string, t: number) {
  const p = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  const a = p(c1);
  const b = p(c2);
  return (
    '#' +
    a
      .map((v, i) =>
        Math.round(lerp(v, b[i]!, clamp(t, 0, 1)))
          .toString(16)
          .padStart(2, '0'),
      )
      .join('')
  );
}

/* textures: fine grains, so powder and froth read as stuff, not as shapes */
type Paint = (x: CanvasRenderingContext2D, px: number, py: number, r: number) => void;
function texture(n: number, paint: Paint) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const x = c.getContext('2d')!;
  seed = 3 + n;
  for (let i = 0; i < n; i++) paint(x, rnd() * 128, rnd() * 128, rnd());
  return g.createPattern(c, 'repeat') ?? '#000';
}
let TEX: Record<'powder' | 'fine' | 'coarse' | 'milk', CanvasPattern | string> | null = null;
let wood: HTMLCanvasElement | null = null;

function round(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}
function disc(x: number, y: number, r: number, fill: string | CanvasGradient | CanvasPattern) {
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fillStyle = fill;
  g.fill();
}
function shadow(x: number, y: number, r: number, a = 0.22, off = 1) {
  const gr = g.createRadialGradient(
    x + 8 * off,
    y + 12 * off,
    r * 0.6,
    x + 8 * off,
    y + 12 * off,
    r * 1.15,
  );
  gr.addColorStop(0, `rgba(40,20,5,${a})`);
  gr.addColorStop(1, 'rgba(40,20,5,0)');
  disc(x + 8 * off, y + 12 * off, r * 1.15, gr);
}
function ring(x: number, y: number, r: number) {
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.stroke();
}

function paintWood() {
  wood = document.createElement('canvas');
  wood.width = W;
  wood.height = H;
  const w = wood.getContext('2d')!;
  const gr = w.createLinearGradient(0, 0, W, H);
  gr.addColorStop(0, '#c99a68');
  gr.addColorStop(1, '#a87446');
  w.fillStyle = gr;
  w.fillRect(0, 0, W, H);
  seed = 11;
  for (let i = 0; i < 46; i++) {
    const y0 = rnd() * H;
    w.strokeStyle = `rgba(90,52,24,${0.05 + rnd() * 0.09})`;
    w.lineWidth = 1 + rnd() * 2.5;
    w.beginPath();
    for (let x = -10; x <= W + 10; x += 20)
      w.lineTo(x, y0 + Math.sin(x / (60 + rnd() * 40) + i) * 5);
    w.stroke();
  }
  w.fillStyle = '#efe3c9';
  w.strokeStyle = '#d7c49e';
  w.lineWidth = 3;
  round(w, 30, 40, 740, 530, 18);
  w.fill();
  w.stroke();
  w.strokeStyle = 'rgba(160,130,80,.18)';
  w.lineWidth = 1;
  for (let y = 52; y < 566; y += 7) {
    w.beginPath();
    w.moveTo(40, y);
    w.lineTo(760, y);
    w.stroke();
  }
}

/** the canvas is new: make its textures and the tray once */
export function prepare(ctx: CanvasRenderingContext2D) {
  g = ctx;
  TEX = {
    powder: texture(2600, (x, px, py, r) => {
      x.fillStyle = r < 0.4 ? '#c4e384' : r < 0.75 ? '#5d8a26' : '#9cc95a';
      x.globalAlpha = 0.35 + r * 0.5;
      x.fillRect(px, py, r < 0.9 ? 1 : 2, r < 0.9 ? 1 : 2);
    }),
    fine: texture(2400, (x, px, py, r) => {
      x.fillStyle = r < 0.8 ? '#eef7d2' : '#6f9532';
      x.globalAlpha = 0.25 + r * 0.55;
      x.fillRect(px, py, r < 0.7 ? 1 : 1.6, r < 0.7 ? 1 : 1.6);
    }),
    coarse: texture(70, (x, px, py, r) => {
      x.strokeStyle = 'rgba(240,250,215,.8)';
      x.lineWidth = 1;
      x.beginPath();
      x.arc(px, py, 2 + r * 3.5, 0, Math.PI * 2);
      x.stroke();
    }),
    milk: texture(1600, (x, px, py, r) => {
      x.fillStyle = '#ffffff';
      x.globalAlpha = 0.15 + r * 0.3;
      x.fillRect(px, py, 1, 1);
    }),
  };
  if (!wood) paintWood();
}

/* a heap of powder: a lumpy outline, light on the top left, grains all over,
   and a little dust spilled round it */
function blob(x: number, y: number, s: number, k: number) {
  g.beginPath();
  for (let i = 0; i <= 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    const rr = s * (1 + 0.13 * Math.sin(a * 3 + k) + 0.07 * Math.sin(a * 5 + k * 2.3));
    if (i) g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    else g.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  g.closePath();
}
function pile(x: number, y: number, s: number, k = 0) {
  g.save();
  g.shadowColor = 'rgba(40,25,5,.35)';
  g.shadowBlur = s * 0.5;
  g.shadowOffsetY = s * 0.15;
  blob(x, y, s, k);
  const gr = g.createRadialGradient(x - s * 0.35, y - s * 0.4, s * 0.05, x, y, s * 1.15);
  gr.addColorStop(0, '#bddc7a');
  gr.addColorStop(0.45, '#88b545');
  gr.addColorStop(1, '#557f20');
  g.fillStyle = gr;
  g.fill();
  g.restore();
  g.save();
  blob(x, y, s, k);
  g.clip();
  g.globalAlpha = 0.6;
  g.fillStyle = TEX!.powder;
  g.fillRect(x - s * 1.3, y - s * 1.3, s * 2.6, s * 2.6);
  g.restore();
  g.fillStyle = 'rgba(110,160,55,.6)';
  for (let i = 0; i < 30; i++) {
    const p = SCATTER[Math.floor(i * 7 + k * 13) % SCATTER.length]!;
    const d = s * (1.04 + p.r * 0.4);
    g.fillRect(x + Math.cos(p.a) * d, y + Math.sin(p.a) * d, 1.3, 1.3);
  }
}

function drawNatsume(t: Table) {
  const { x, y, r } = SPOT.natsume;
  shadow(x, y, r);
  disc(x, y, r, '#1a1210');
  /* the tea inside, seen when the lid slides */
  g.save();
  g.beginPath();
  g.arc(x, y, r - 7, 0, Math.PI * 2);
  g.clip();
  const gp = g.createRadialGradient(x - 12, y - 14, 4, x, y, r);
  gp.addColorStop(0, '#a9cf63');
  gp.addColorStop(1, '#4f781c');
  g.fillStyle = gp;
  g.fillRect(x - r, y - r, 2 * r, 2 * r);
  g.fillStyle = TEX!.powder;
  g.fillRect(x - r, y - r, 2 * r, 2 * r);
  if (t.drag?.tool === 'chashaku' && t.drag.dig) {
    g.fillStyle = 'rgba(40,60,15,.35)';
    blob(t.drag.x, t.drag.y, 10, 2);
    g.fill();
  }
  g.restore();
  const k = easeOut(t.lid);
  g.save();
  g.translate(x + k * 46, y - k * 22);
  g.rotate(k * 0.35);
  if (k > 0.02) shadow(0, 0, r, 0.25 * k, 0.6);
  const gr = g.createRadialGradient(-15, -18, 4, 0, 0, r);
  gr.addColorStop(0, '#4a3a33');
  gr.addColorStop(1, '#130d0b');
  disc(0, 0, r, gr);
  g.strokeStyle = '#b8913e';
  g.lineWidth = 2;
  ring(0, 0, r - 9);
  g.strokeStyle = '#caa24a';
  g.lineWidth = 2.5;
  g.beginPath();
  g.moveTo(-18, 14);
  g.quadraticCurveTo(0, -4, 20, -18);
  g.stroke();
  for (const [dx, dy] of [
    [-6, 4],
    [4, -6],
    [12, -12],
  ] as const)
    disc(dx, dy, 4, '#caa24a');
  g.restore();
}
function drawChashaku(tx: number, ty: number, ang: number, loaded: boolean, lifted: boolean) {
  g.save();
  g.translate(tx, ty);
  g.rotate(ang);
  g.fillStyle = `rgba(40,20,5,${lifted ? 0.12 : 0.18})`;
  round(g, -88 + (lifted ? 10 : 0), lifted ? 16 : 4, 176, 14, 7);
  g.fill();
  const gr = g.createLinearGradient(0, -7, 0, 7);
  gr.addColorStop(0, '#e9d29c');
  gr.addColorStop(1, '#bf9a57');
  g.fillStyle = gr;
  round(g, -90, -6, 180, 12, 6);
  g.fill();
  g.fillStyle = '#a07a3c';
  g.fillRect(-8, -6, 5, 12);
  g.beginPath();
  g.ellipse(-86, 0, 10, 8, 0, 0, Math.PI * 2);
  g.fillStyle = '#d9bd80';
  g.fill();
  g.restore();
  if (loaded) pile(tx - Math.cos(ang) * 86, ty - Math.sin(ang) * 86 - 1, 9, 5);
}
/* the water pitcher and the milk pitcher; rot turns the spout (which points left) */
function drawYuzamashi(x: number, y: number, scale = 1, rot = 0, lifted = 0) {
  g.save();
  g.translate(x, y);
  shadow(0, 0, 50 * scale, 0.2, 1 + lifted * 2);
  g.rotate(rot);
  g.scale(scale, scale);
  disc(0, 0, 50, '#f3eee6');
  g.beginPath();
  g.moveTo(-44, -18);
  g.lineTo(-68, 0);
  g.lineTo(-44, 18);
  g.closePath();
  g.fillStyle = '#e8e1d5';
  g.fill();
  disc(0, 0, 40, '#dcd3c4');
  disc(0, 0, 36, '#cfe0ea');
  g.restore();
}
function drawPitcher(x: number, y: number, scale = 1, rot = 0, lifted = 0) {
  g.save();
  g.translate(x, y);
  shadow(0, 0, 44 * scale, 0.2, 1 + lifted * 2);
  g.rotate(rot);
  g.scale(scale, scale);
  const gr = g.createRadialGradient(-14, -16, 4, 0, 0, 46);
  gr.addColorStop(0, '#f6f8fa');
  gr.addColorStop(1, '#9aa5ae');
  disc(0, 0, 44, gr);
  g.beginPath();
  g.moveTo(-38, -16);
  g.lineTo(-62, 0);
  g.lineTo(-38, 16);
  g.closePath();
  g.fillStyle = '#c3cbd2';
  g.fill();
  g.fillStyle = '#8c969e';
  round(g, 38, -8, 30, 16, 6);
  g.fill();
  disc(0, 0, 36, '#fbf8f1');
  g.restore();
}
/* the whisk at rest, from above: a ring of fine tines */
function drawChasen(x: number, y: number) {
  g.save();
  g.translate(x, y);
  shadow(0, 0, 44);
  disc(0, 0, 42, '#ead7a8');
  g.strokeStyle = '#c7a764';
  g.lineWidth = 1.4;
  for (let i = 0; i < 64; i++) {
    const a = (i / 64) * Math.PI * 2;
    g.beginPath();
    g.moveTo(Math.cos(a) * 14, Math.sin(a) * 14);
    g.lineTo(Math.cos(a) * 41, Math.sin(a) * 41);
    g.stroke();
  }
  disc(0, 0, 15, '#d6b977');
  disc(0, 0, 9, '#b69047');
  g.restore();
}
/* the whisk in the hand, seen from the side at 45°: the tines at the finger,
   curled in at the tips, the black thread, then the bamboo handle going up
   and to the right */
function chasenShape() {
  g.beginPath();
  g.moveTo(50, -8);
  g.bezierCurveTo(32, -13, 12, -23, 4, -15);
  g.quadraticCurveTo(-3, 0, 4, 15);
  g.bezierCurveTo(12, 23, 32, 13, 50, 8);
  g.closePath();
}
function drawChasenSide(x: number, y: number) {
  g.save();
  g.translate(x, y);
  g.rotate(-Math.PI / 4);
  g.scale(1.3, 1.3);
  g.save();
  g.translate(9, 15);
  g.fillStyle = 'rgba(40,20,5,.18)';
  chasenShape();
  g.fill();
  round(g, 48, -7, 76, 14, 7);
  g.fill();
  g.restore();
  const tg = g.createLinearGradient(0, -20, 0, 20);
  tg.addColorStop(0, '#f2e2b8');
  tg.addColorStop(1, '#c4a160');
  g.fillStyle = tg;
  chasenShape();
  g.fill();
  g.strokeStyle = 'rgba(150,115,55,.75)';
  g.lineWidth = 0.8;
  for (let i = -7; i <= 7; i++) {
    g.beginPath();
    g.moveTo(50, i * 1.05);
    g.quadraticCurveTo(22, i * 3.1, 6, i * 2.1);
    g.stroke();
  }
  g.fillStyle = '#e4cf98';
  g.strokeStyle = '#b8964f';
  g.lineWidth = 1;
  g.beginPath();
  g.ellipse(10, 0, 5, 10, 0, 0, Math.PI * 2);
  g.fill();
  g.stroke();
  g.fillStyle = '#2c241d';
  g.fillRect(46, -9, 6, 18);
  const hg = g.createLinearGradient(0, -7, 0, 7);
  hg.addColorStop(0, '#ecd6a0');
  hg.addColorStop(1, '#b38a45');
  g.fillStyle = hg;
  round(g, 52, -6.5, 72, 13, 6.5);
  g.fill();
  g.fillStyle = '#9c763a';
  g.fillRect(98, -6.5, 3.5, 13);
  g.restore();
}

const liquidOf = (v: Tea) => v.water + v.milk * 160;
export const surfR = (ri: number, v: Tea, full: number) =>
  Math.min(ri - 3, ri * (0.42 + 0.5 * clamp(liquidOf(v) / full, 0, 1.25)));

/* matcha from above: heaps of powder; then a pool that grows with the water,
   dark with floating lumps until it's whisked, then pale and frothy (coarse
   bubbles where the whisking was sloppy) */
function drawTea(v: Tea, x: number, y: number, ri: number, full: number) {
  if (!liquidOf(v)) {
    for (const p of v.piles) pile(x + p.x, y + p.y, p.s, p.k);
    return;
  }
  const rr = surfR(ri, v, full);
  const has = v.piles.length > 0;
  let base = has ? mix('#33501a', '#9cbf55', v.foam) : '#cfe0ea';
  if (v.milk) base = mix(mix('#33501a', '#86ad45', v.foam), '#dfe9c4', v.milk * 0.75);
  g.save();
  g.beginPath();
  g.arc(x, y, rr, 0, Math.PI * 2);
  g.clip();
  const gr = g.createRadialGradient(x - rr * 0.3, y - rr * 0.3, rr * 0.1, x, y, rr);
  gr.addColorStop(0, mix(base, '#ffffff', 0.12));
  gr.addColorStop(0.85, base);
  gr.addColorStop(1, mix(base, '#000000', 0.25));
  g.fillStyle = gr;
  g.fillRect(x - rr, y - rr, 2 * rr, 2 * rr);
  if (has && v.foam < 0.45 && !v.milk) {
    /* lumps not yet whisked in */
    g.globalAlpha = 1 - v.foam / 0.45;
    for (let i = 0; i < 16; i++) {
      const p = SCATTER[i * 3]!;
      blob(x + Math.cos(p.a) * p.r * rr * 0.8, y + Math.sin(p.a) * p.r * rr * 0.8, 3 + p.s * 6, i);
      g.fillStyle = i % 2 ? '#2a420f' : '#4d7420';
      g.fill();
    }
  }
  if (has && v.foam > 0.02) {
    g.globalAlpha = Math.min(1, v.foam * 1.1) * (v.milk ? 0.35 : 1);
    g.fillStyle = TEX!.fine;
    g.fillRect(x - rr, y - rr, 2 * rr, 2 * rr);
    if (v.acc < 0.85 && !v.milk) {
      g.globalAlpha = v.foam * clamp((0.85 - v.acc) * 2.2, 0, 1);
      g.fillStyle = TEX!.coarse;
      g.fillRect(x - rr, y - rr, 2 * rr, 2 * rr);
    }
  }
  if (v.milk) {
    g.globalAlpha = v.milk * 0.5;
    g.fillStyle = TEX!.milk;
    g.fillRect(x - rr, y - rr, 2 * rr, 2 * rr);
  }
  g.restore();
  g.strokeStyle = 'rgba(0,0,0,.18)';
  g.lineWidth = 3;
  ring(x, y, rr);
  g.strokeStyle = 'rgba(255,255,255,.18)';
  g.beginPath();
  g.arc(x, y, rr - 6, Math.PI * 1.1, Math.PI * 1.45);
  g.stroke();
}
function drawBowl(t: Table) {
  const { x, y, r, ri } = BOWL;
  shadow(x, y, r, 0.3);
  const gr = g.createRadialGradient(x - 40, y - 50, 10, x, y, r);
  gr.addColorStop(0, '#4b3a30');
  gr.addColorStop(0.8, '#231a16');
  gr.addColorStop(1, '#16100d');
  disc(x, y, r, gr);
  g.strokeStyle = '#6a5446';
  g.lineWidth = 3;
  g.beginPath();
  g.arc(x, y, r - 4, Math.PI * 1.05, Math.PI * 1.7);
  g.stroke();
  const gi = g.createRadialGradient(x, y + 10, 10, x, y, ri);
  gi.addColorStop(0, '#2c221d');
  gi.addColorStop(1, '#3b2e27');
  disc(x, y, ri, gi);
  drawTea(t.bowl, x, y, ri, 80);
}
function drawCup(t: Table) {
  const { x, y, r, ri, saucer } = CUP;
  shadow(x, y, saucer, 0.2);
  disc(x, y, saucer, '#f4efe6');
  g.strokeStyle = '#ddd3c3';
  g.lineWidth = 2;
  ring(x, y, saucer - 10);
  g.fillStyle = '#ffffff';
  round(g, x + r - 12, y - 13, 46, 26, 13);
  g.fill();
  g.strokeStyle = '#e1d8c9';
  g.stroke();
  shadow(x, y, r, 0.16);
  disc(x, y, r, '#ffffff');
  disc(x, y, ri, '#efe8dc');
  drawTea(t.cup, x, y, ri, 120);
  if (t.cup.milk > 0) drawArt(t);
}
function drawArt(t: Table) {
  const c = t.cup;
  const { x, y, ri } = CUP;
  const white = '#fdf9f0';
  g.save();
  g.beginPath();
  g.arc(x, y, surfR(ri, c, 120), 0, Math.PI * 2);
  g.clip();
  if (c.art) heart(x + c.art.off * 0.35, y, ART.R, c.art.off / ART.R, white);
  else if (c.dot > 0) {
    disc(x, y, c.dot, white);
    g.strokeStyle = 'rgba(200,215,150,.5)';
    g.lineWidth = 2;
    for (let k = 1; k <= 2; k++) ring(x, y, c.dot * (k / 3));
  }
  if (c.cut && c.cut.length > 1) {
    /* the pull-through, a thin white line */
    g.strokeStyle = white;
    g.lineWidth = 3;
    g.lineCap = 'round';
    line(c.cut);
  }
  g.restore();
  if (t.trace && !c.art) arrowGuide(artPath());
}
/* the classic heart curve, point up: the pull-through ends at the far side,
   so it's the right way up for Ayano across the table. Sheared when the pour
   wandered. */
function heart(cx: number, cy: number, size: number, shear: number, fill: string) {
  const s = size / 15.5;
  g.beginPath();
  for (let i = 0; i <= 80; i++) {
    const a = (i / 80) * Math.PI * 2;
    const hx = 16 * Math.sin(a) ** 3;
    const hy = -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a));
    const X = cx + (hx - hy * shear * 1.4) * s;
    const Y = cy - (hy - 2) * s;
    if (i) g.lineTo(X, Y);
    else g.moveTo(X, Y);
  }
  g.closePath();
  g.fillStyle = fill;
  g.fill();
}
function line(pts: Pt[]) {
  g.beginPath();
  pts.forEach((p, i) => (i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)));
  g.stroke();
}
/* a dashed line to follow: a dark edge under white dashes, a dot where to start */
function guide(pts: Pt[]) {
  const p0 = pts[0]!;
  g.save();
  g.lineJoin = 'round';
  g.lineCap = 'round';
  g.setLineDash([12, 10]);
  g.strokeStyle = 'rgba(20,30,10,.45)';
  g.lineWidth = 6;
  line(pts);
  g.strokeStyle = 'rgba(255,255,255,.9)';
  g.lineWidth = 3;
  line(pts);
  g.setLineDash([]);
  disc(p0.x, p0.y, 7, 'rgba(255,255,255,.95)');
  disc(p0.x, p0.y, 3.5, '#1d3e5c');
  g.restore();
}
function arrowGuide(pts: Pt[]) {
  guide(pts);
  const a = pts[pts.length - 2]!;
  const b = pts[pts.length - 1]!;
  g.save();
  g.translate(b.x, b.y);
  g.rotate(Math.atan2(b.y - a.y, b.x - a.x));
  g.beginPath();
  g.moveTo(4, 0);
  g.lineTo(-10, -8);
  g.lineTo(-10, 8);
  g.closePath();
  g.fillStyle = '#fff';
  g.strokeStyle = 'rgba(20,30,10,.45)';
  g.lineWidth = 2;
  g.fill();
  g.stroke();
  g.restore();
}
/* the drag to make, before the first one: a dashed arrow fades in and a dot
   travels along it */
function drawDemo(t: Table, now: number) {
  const d = t.demo;
  if (!d || t.drag || t.quiz) return;
  const k = d.keep
    ? Math.min(1, ((now - d.t0) % (d.ms + 900)) / d.ms)
    : ((now - d.t0) % d.every) / d.ms;
  if (k > 1 && !d.keep) return;
  g.save();
  g.globalAlpha = d.keep ? 1 : Math.min(1, Math.sin(Math.min(1, k) * Math.PI) * 2.2);
  arrowGuide(d.pts);
  const h = along(d.pts, easeInOut(Math.min(1, k * 1.15)));
  disc(h.x, h.y, 15, 'rgba(233,162,59,.35)');
  disc(h.x, h.y, 8, 'rgba(233,162,59,.95)');
  g.restore();
}
/* a tool's name on the table, in Japanese with its reading */
const LABEL: Partial<Record<Spot, string>> = {
  chasen: '茶筅（ちゃせん）',
  chashaku: '茶杓（ちゃしゃく）',
  natsume: '棗（なつめ）',
  yuzamashi: '湯冷まし（ゆざまし）',
  pitcher: 'ミルクピッチャー',
  chawan: '茶碗（ちゃわん）',
  cup: 'カップ',
};
function label(k: Spot) {
  const tl = SPOT[k];
  const text = LABEL[k] ?? '';
  g.font = '700 22px "Hiragino Sans", "Yu Gothic UI", "Noto Sans JP", system-ui, sans-serif';
  const w = g.measureText(text).width + 20;
  const lx = clamp(tl.x - w / 2, 8, W - w - 8);
  const ly = clamp(k === 'pitcher' ? tl.y - tl.r - 40 : tl.y + tl.r + 6, 8, H - 40);
  g.fillStyle = 'rgba(255,255,255,.95)';
  round(g, lx, ly, w, 34, 17);
  g.fill();
  g.strokeStyle = '#1d3e5c';
  g.lineWidth = 2;
  g.stroke();
  g.fillStyle = '#15202b';
  g.textBaseline = 'middle';
  g.fillText(text, lx + 10, ly + 18);
}
/* the tool in the hand: the scoop's bowl, the whisk's tines or a pitcher's
   spout sits at the finger */
function drawHeld(t: Table, now: number) {
  const d = t.drag!;
  if (d.tool === 'chashaku') {
    const a = -0.35;
    drawChashaku(d.x + Math.cos(a) * 86, d.y + Math.sin(a) * 86, a, !!d.loaded, true);
    return;
  }
  if (d.tool === 'chasen') {
    drawChasenSide(d.x, d.y);
    return;
  }
  const high = d.style === 'high';
  const low = d.style === 'low';
  const off = high ? 92 : low ? 62 : 76;
  const sc = high ? 1.14 : 1;
  const cx = d.x + off * 0.8;
  const cy = d.y - off * 0.62;
  const rot = Math.atan2(d.y - cy, d.x - cx) - Math.PI;
  if (d.pouring) {
    const sx = cx + Math.cos(rot + Math.PI) * 62 * sc;
    const sy = cy + Math.sin(rot + Math.PI) * 62 * sc;
    g.strokeStyle = d.tool === 'yuzamashi' ? 'rgba(220,236,245,.9)' : 'rgba(255,253,246,.97)';
    g.lineWidth = low ? 9 : high ? 3.5 : 6;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(sx, sy);
    g.quadraticCurveTo(sx - 6 + Math.sin(now / 60) * 2, (sy + d.y) / 2 + 6, d.x, d.y);
    g.stroke();
  }
  /* see the dashed line through the pitcher while tracing */
  if (t.trace) g.globalAlpha = 0.45;
  (d.tool === 'yuzamashi' ? drawYuzamashi : drawPitcher)(cx, cy, sc, rot, high ? 1.5 : 1);
  g.globalAlpha = 1;
}

export function draw(t: Table, now: number, cw: number, ch: number) {
  g.setTransform(cw / W, 0, 0, ch / H, 0, 0);
  g.drawImage(wood!, 0, 0);
  /* the tray slides in from the top */
  g.save();
  g.translate(0, (1 - easeOut(t.arrive)) * -420);
  const held = t.drag?.tool;
  drawNatsume(t);
  if (held !== 'chasen') drawChasen(SPOT.chasen.x, SPOT.chasen.y);
  if (t.scoop === null && held !== 'chashaku')
    drawChashaku(SPOT.chashaku.x, SPOT.chashaku.y, -0.12, false, false);
  if (held !== 'yuzamashi') drawYuzamashi(SPOT.yuzamashi.x, SPOT.yuzamashi.y);
  if (held !== 'pitcher') drawPitcher(SPOT.pitcher.x, SPOT.pitcher.y);
  drawBowl(t);
  drawCup(t);
  if (t.whisk) guide(wPath(t.whisk));
  if (t.hint && !t.drag) {
    /* a soft ring on what to pick up */
    const tl = SPOT[t.hint];
    const pulse = 0.5 + 0.5 * Math.sin(now / 300);
    g.strokeStyle = `rgba(233,162,59,${0.5 + pulse * 0.4})`;
    g.lineWidth = 4;
    g.setLineDash([8, 6]);
    ring(tl.x, tl.y, tl.r + 10 + pulse * 3);
    g.setLineDash([]);
  }
  if (t.scoop !== null) {
    /* the scoop flies caddy → cup on its own */
    const k = easeInOut(t.scoop);
    const x = lerp(SPOT.natsume.x + 90, CUP.x + 80, k);
    const y = lerp(SPOT.natsume.y, CUP.y, k) - Math.sin(k * Math.PI) * 60;
    drawChashaku(x, y, -0.2, t.scoop < 0.95, true);
  }
  if (t.mark) {
    const tl = SPOT[t.mark.k];
    g.strokeStyle = t.mark.ok ? '#1e5b22' : '#a3241b';
    g.lineWidth = 5;
    ring(tl.x, tl.y, tl.r + 8);
  }
  if (t.quiz) {
    /* every tool can be tapped */
    const pulse = 0.5 + 0.5 * Math.sin(now / 300);
    g.strokeStyle = `rgba(29,62,92,${0.25 + pulse * 0.3})`;
    g.lineWidth = 3;
    g.setLineDash([6, 6]);
    for (const k of ['natsume', 'chasen', 'yuzamashi', 'pitcher'] as const)
      ring(SPOT[k].x, SPOT[k].y, SPOT[k].r + 8);
    const c = SPOT.chashaku;
    round(g, c.x - 105, c.y - 26, 210, 52, 26);
    g.stroke();
    g.setLineDash([]);
  }
  drawDemo(t, now);
  for (const k of t.labels) label(k);
  if (t.drag) drawHeld(t, now);
  g.restore();
}
