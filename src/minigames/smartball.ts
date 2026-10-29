/* The smart-ball table (level 8, Osaka scene 7), outside React like the map
   runtime: a canvas, the physics, the flippers, Yuki's play and a few sound
   blips. It writes the match to the `sb` store; SmartBall.tsx shows the rest.
   Prototype: docs/06-design/minigames/smartball/. */
import type { SbLine } from '../content/smartball';
import { sb, SB_START, sbLimit, sbTotal, type Sb } from '../state/smartball';

/* ---------- the table ---------- */
const W = 300;
const H = 470;
const R = 7; // marble radius
const G = 420; // gravity along the tilted table, px/s² (a slow, gentle table)
const ARC = { x: 150, y: 160, r: 142 };
const LANE_X = 276;
const RIGHT_X = 292;
const LANE_TOP = 178;
const PLUNGER_Y = H - 24;
const DRAIN_Y = H - 12;
/* the clock on each ball: it starts short and every hole adds to it; when it
   runs out the flippers go dark and the ball drains */
const BALL_TIME = 20;
const BONUS = 5;
const BONUS_TEN = 8; // the 10-point hole
/* Yuki's turn plays faster than real time, so watching it does not drag */
const YUKI_SPEED = 1.7;
const STEP = 1 / 900; // physics step: the marble moves under 1.5 px per step
const FLIP_LEN = 63;
/* flipper pivots: their tips leave a narrow gap to drain through */
const FL_X = 66;
const FR_X = 218;
/* a ball that drains this soon after launch comes back once (a ball save) */
const SAVE_TIME = 5;

interface Hole {
  x: number;
  y: number;
  v: number;
}
interface Bumper {
  x: number;
  y: number;
  r: number;
  lit: number;
}
interface Seg {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}
interface Pin {
  x: number;
  y: number;
  r: number;
}
interface Flipper {
  px: number;
  py: number;
  rest: number;
  up: number;
  ang: number;
  w: number;
  held: boolean;
}
interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  left: boolean;
  still: number;
  t: number;
  cool: number;
  hold: number;
  /** seconds this ball may stay up: BALL_TIME plus what its holes added */
  limit: number;
  /** the ball save has been used */
  saved: boolean;
  state: 'ready' | 'flying' | 'held' | 'done';
}
type Side = 'left' | 'right';

/* numbered holes: a marble that rolls in scores the number and is kicked back out */
const HOLES: Hole[] = [
  { x: 142, y: 128, v: 3 },
  { x: 62, y: 214, v: 5 },
  { x: 222, y: 214, v: 5 },
  { x: 142, y: 286, v: 10 },
  { x: 36, y: 300, v: 3 },
  { x: 248, y: 300, v: 3 },
];
const BUMPERS: Bumper[] = [
  { x: 102, y: 168, r: 13, lit: 0 },
  { x: 182, y: 168, r: 13, lit: 0 },
  { x: 142, y: 222, r: 13, lit: 0 },
];
const segs: Seg[] = [];
const seg = (x1: number, y1: number, x2: number, y2: number) => segs.push({ x1, y1, x2, y2 });
seg(8, ARC.y, 8, H - 132);
for (let i = 0, n = 48; i < n; i++) {
  const a1 = Math.PI - (Math.PI * i) / n;
  const a2 = Math.PI - (Math.PI * (i + 1)) / n;
  seg(
    ARC.x + ARC.r * Math.cos(a1),
    ARC.y - ARC.r * Math.sin(a1),
    ARC.x + ARC.r * Math.cos(a2),
    ARC.y - ARC.r * Math.sin(a2),
  );
}
seg(RIGHT_X, ARC.y, RIGHT_X, H);
seg(LANE_X, LANE_TOP, LANE_X, H);
seg(LANE_X, PLUNGER_Y + R, RIGHT_X, PLUNGER_Y + R);
/* the slopes that feed the flippers */
seg(8, H - 132, FL_X, H - 70);
seg(LANE_X, H - 132, FR_X, H - 70);

/* a few rows of brass pins, as on a smart-ball table */
const pins: Pin[] = [];
for (let row = 0, y = 92; y < 340; row++, y += 34) {
  for (let x = 30 + (row % 2) * 22; x < LANE_X - 16; x += 44) {
    if (HOLES.some((h) => Math.hypot(h.x - x, h.y - y) < 26)) continue;
    if (BUMPERS.some((b) => Math.hypot(b.x - x, b.y - y) < b.r + 18)) continue;
    if (y < ARC.y && Math.hypot(x - ARC.x, y - ARC.y) > ARC.r - 20) continue;
    pins.push({ x, y, r: 2.4 });
  }
}
/* flippers: angle 0 points right, y grows downwards */
const flips: Record<Side, Flipper> = {
  left: { px: FL_X, py: H - 70, rest: 0.5, up: -0.45, ang: 0.5, w: 0, held: false },
  right: {
    px: FR_X,
    py: H - 70,
    rest: Math.PI - 0.5,
    up: Math.PI + 0.45,
    ang: Math.PI - 0.5,
    w: 0,
    held: false,
  },
};

/* ---------- sound: a few WebAudio blips, started by a tap ---------- */
let ac: AudioContext | null = null;
function audio() {
  if (sb.get().muted) return null;
  try {
    ac = ac ?? new AudioContext();
  } catch {
    return null;
  }
  if (ac.state === 'suspended') void ac.resume();
  return ac;
}
function tone(freq: number, dur: number, type: OscillatorType = 'sine', vol = 0.15, when = 0) {
  const a = audio();
  if (!a) return;
  const t = a.currentTime + when;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}
let lastTick = 0;
const sfx = {
  pin(force: number) {
    const n = performance.now();
    if (n - lastTick < 35) return;
    lastTick = n;
    tone(2100 + Math.random() * 500, 0.04, 'triangle', Math.min(0.12, force / 3000));
  },
  shoot() {
    tone(180, 0.12, 'square', 0.08);
    tone(90, 0.18, 'sine', 0.12);
  },
  hole(v: number) {
    const base = v >= 10 ? 880 : v >= 5 ? 740 : 620;
    tone(base, 0.12, 'triangle', 0.14);
    tone(base * 1.5, 0.22, 'triangle', 0.12, 0.09);
    if (v >= 10) tone(base * 2, 0.3, 'triangle', 0.1, 0.2);
  },
  bump() {
    tone(520, 0.08, 'square', 0.07);
    tone(780, 0.1, 'triangle', 0.08, 0.03);
  },
  flip() {
    tone(240, 0.05, 'square', 0.05);
  },
  out() {
    tone(140, 0.25, 'sine', 0.12);
  },
};

/* ---------- the match ---------- */
let ball: Ball | null = null;
let power = 0;
let charging = false;
let chargeT = 0;
const pops: { x: number; y: number; text: string; t: number }[] = [];
const timers = new Set<ReturnType<typeof setTimeout>>();
const later = (ms: number, fn: () => void) => {
  const id = setTimeout(() => {
    timers.delete(id);
    fn();
  }, ms);
  timers.add(id);
};
let onEnd: (won: boolean) => void = () => {};

const set = (p: Partial<Sb>) => sb.set(p);
const say = (line: SbLine) => sb.set((s) => ({ line, seq: s.seq + 1 }));
const played = (who: 'me' | 'yuki') => sb.get()[who].length;

function score(v: number, x: number, y: number) {
  sb.set((s) => ({ cur: s.cur + v }));
  pops.push({ x, y, text: '+' + v, t: 0 });
}
function nextBall() {
  const s = sb.get();
  if (played('me') >= sbLimit(s) && played('yuki') >= sbLimit(s)) return endMatch();
  ball = {
    x: (LANE_X + RIGHT_X) / 2,
    y: PLUNGER_Y,
    vx: 0,
    vy: 0,
    left: false,
    still: 0,
    t: 0,
    cool: 0,
    hold: 0,
    limit: BALL_TIME,
    saved: false,
    state: 'ready',
  };
  power = 0;
  flips.left.held = flips.right.held = false;
  set({ cur: 0, ready: true });
  if (s.turn === 'yuki') yukiLaunches();
}
function release() {
  if (!charging || !ball) return;
  charging = false;
  ball.state = 'flying';
  ball.vy = -(340 + power * 470);
  sfx.shoot();
  const s = sb.get();
  /* the first ball of the match: show what the paddles are for */
  set({ ready: false, flipTip: s.turn === 'me' && !s.me.length });
  if (s.turn === 'me' && !s.me.length) later(5000, () => set({ flipTip: false }));
}
function rollBack() {
  if (!ball) return;
  Object.assign(ball, { vx: 0, vy: 0, y: PLUNGER_Y, state: 'ready', t: 0 });
  power = 0;
  set({ ready: true });
  if (sb.get().turn === 'me') say('weak');
  else yukiLaunches();
}
/* drained right after launch: back on the plunger, once per ball */
function saveBall() {
  if (!ball) return;
  Object.assign(ball, {
    vx: 0,
    vy: 0,
    x: (LANE_X + RIGHT_X) / 2,
    y: PLUNGER_Y,
    state: 'ready',
    t: 0,
    left: false,
    saved: true,
  });
  power = 0;
  flips.left.held = flips.right.held = false;
  pops.push({ x: (FL_X + FR_X) / 2, y: H - 40, text: 'SAVE!', t: 0 });
  sfx.hole(5);
  set({ ready: true });
  if (sb.get().turn === 'yuki') yukiLaunches();
}
function drain() {
  if (!ball) return;
  ball.state = 'done';
  flips.left.held = flips.right.held = false;
  const s = sb.get();
  const me = s.turn === 'me';
  const pts = s.cur;
  sb.set({ [s.turn]: [...s[s.turn], pts], cur: 0, flipTip: false } as Partial<Sb>);
  sfx.out();
  say(
    pts >= 15
      ? me
        ? 'meBig'
        : 'yukiDrainBig'
      : pts > 0
        ? me
          ? 'meSmall'
          : 'yukiSmall'
        : me
          ? 'meOut'
          : 'yukiOut',
  );
  later(me ? 1300 : 800, () => {
    const turn = sb.get().turn === 'me' ? 'yuki' : 'me';
    set({ turn });
    if (turn === 'yuki' && played('yuki') < sbLimit(sb.get())) say('yukiTurn');
    nextBall();
  });
}
function endMatch() {
  const s = sb.get();
  const me = sbTotal(s, 'me');
  const yu = sbTotal(s, 'yuki');
  if (me === yu) {
    set({ extra: s.extra + 1, turn: 'me' });
    say('tie');
    later(1400, nextBall);
    return;
  }
  ball = null;
  set({ phase: 'end', ready: false });
  onEnd(me > yu);
}
/* Yuki pulls to a strength of his own and plays by the same physics */
function yukiLaunches() {
  const target = 0.35 + Math.random() * 0.6;
  later(500, () => {
    if (!ball || ball.state !== 'ready') return;
    charging = true;
    chargeT = 0;
    const wait = () => {
      if (!charging) return;
      if (power >= target) release();
      else later(16, wait);
    };
    wait();
  });
}
/* Yuki's flipping: he usually catches a marble coming down at a flipper, not always */
const ai: Record<Side, { plan: boolean | null; t: number }> = {
  left: { plan: null, t: 0 },
  right: { plan: null, t: 0 },
};
function yukiFlips(dt: number) {
  if (!ball) return;
  for (const side of ['left', 'right'] as const) {
    const f = flips[side];
    const a = ai[side];
    const [cx, cy] = closest(
      ball,
      f.px,
      f.py,
      f.px + FLIP_LEN * Math.cos(f.rest),
      f.py + FLIP_LEN * Math.sin(f.rest),
    );
    const near = Math.hypot(ball.x - cx, ball.y - cy) < 26 && ball.vy > 0;
    if (near && a.plan === null) a.plan = Math.random() < 0.72;
    if (!near && !f.held) a.plan = null;
    if (near && a.plan && !f.held) {
      f.held = true;
      a.t = 0.24;
    }
    if (f.held) {
      a.t -= dt;
      if (a.t <= 0) {
        f.held = false;
        a.plan = null;
      }
    }
  }
}

/* ---------- physics ---------- */
function pushOut(b: Ball, cx: number, cy: number, rad: number, e: number, svx = 0, svy = 0) {
  let nx = b.x - cx;
  let ny = b.y - cy;
  const d = Math.hypot(nx, ny);
  const min = R + rad;
  if (d >= min || d === 0) return null;
  nx /= d;
  ny /= d;
  b.x = cx + nx * min;
  b.y = cy + ny * min;
  const vn = (b.vx - svx) * nx + (b.vy - svy) * ny;
  if (vn < 0) {
    b.vx -= (1 + e) * vn * nx;
    b.vy -= (1 + e) * vn * ny;
  }
  return { nx, ny, vn };
}
function closest(b: Ball, x1: number, y1: number, x2: number, y2: number): [number, number] {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const t = Math.max(0, Math.min(1, ((b.x - x1) * dx + (b.y - y1) * dy) / (dx * dx + dy * dy)));
  return [x1 + t * dx, y1 + t * dy];
}
function moveFlippers(dt: number) {
  const dark = !!ball && ball.t > ball.limit;
  for (const f of Object.values(flips)) {
    const target = f.held && !dark ? f.up : f.rest;
    const before = f.ang;
    const d = target - f.ang;
    f.ang += Math.sign(d) * Math.min(Math.abs(d), (f.held ? 22 : 12) * dt);
    f.w = (f.ang - before) / dt;
  }
}
function step(dt: number) {
  const b = ball!;
  moveFlippers(dt);
  if (b.state === 'held') {
    b.hold -= dt;
    if (b.hold <= 0)
      Object.assign(b, { state: 'flying', vx: (Math.random() - 0.5) * 300, vy: 120, cool: 0.5 });
    return;
  }
  b.t += dt;
  b.cool = Math.max(0, b.cool - dt);
  b.vy += G * dt;
  const sp = Math.hypot(b.vx, b.vy);
  if (sp > 1000) {
    b.vx *= 1000 / sp;
    b.vy *= 1000 / sp;
  }
  b.x += b.vx * dt;
  b.y += b.vy * dt;
  for (const s of segs) {
    const [cx, cy] = closest(b, s.x1, s.y1, s.x2, s.y2);
    pushOut(b, cx, cy, 0, 0.3);
  }
  for (const p of pins) {
    const hit = pushOut(b, p.x, p.y, p.r, 0.55);
    if (hit) sfx.pin(-hit.vn);
  }
  for (const k of BUMPERS) {
    const hit = pushOut(b, k.x, k.y, k.r, 0.6);
    if (hit && hit.vn < -40) {
      b.vx += hit.nx * 220;
      b.vy += hit.ny * 220;
      k.lit = 0.25;
      score(1, k.x, k.y - 20);
      sfx.bump();
    }
  }
  for (const f of Object.values(flips)) {
    const [cx, cy] = closest(
      b,
      f.px,
      f.py,
      f.px + FLIP_LEN * Math.cos(f.ang),
      f.py + FLIP_LEN * Math.sin(f.ang),
    );
    /* a paddle only ever pushes a marble that is above it: one coming back down
       passes over a marble under it instead of pressing it through the floor */
    if (b.y > cy) continue;
    /* the flipper's own speed where the marble touches it */
    const hit = pushOut(b, cx, cy, 5, 0.35, -f.w * (cy - f.py), f.w * (cx - f.px));
    if (hit && Math.abs(f.w) > 1 && hit.vn < -200) sfx.flip();
  }
  if (b.x < LANE_X - 6) b.left = true;
  /* a one-way gate: once the marble is on the table, the launch lane is shut */
  if (b.left && b.x > LANE_X - R) {
    b.x = LANE_X - R;
    if (b.vx > 0) b.vx = -b.vx * 0.4;
  }
  if (!b.cool) {
    for (const h of HOLES) {
      if (Math.hypot(b.x - h.x, b.y - h.y) < 13 && Math.hypot(b.vx, b.vy) < 700) {
        Object.assign(b, { state: 'held', hold: 0.7, x: h.x, y: h.y, vx: 0, vy: 0 });
        score(h.v, h.x, h.y - 18);
        /* scoring buys time */
        const more = h.v >= 10 ? BONUS_TEN : BONUS;
        b.limit += more;
        pops.push({ x: (FL_X + FR_X) / 2, y: H - 22, text: `+${more}s`, t: 0 });
        sfx.hole(h.v);
        if (h.v >= 5) say(sb.get().turn === 'me' ? 'meBig' : 'yukiBig');
        return;
      }
    }
  }
  if (b.x < LANE_X && b.y > DRAIN_Y) return b.t < SAVE_TIME && !b.saved ? saveBall() : drain();
  /* not strong enough to clear the arc: it rolls back onto the plunger */
  if (b.x > LANE_X && b.y >= PLUNGER_Y - 1 && b.t > 0.3) return b.left ? drain() : rollBack();
  /* resting on a pin top: a nudge, as you would knock the glass */
  if (Math.hypot(b.vx, b.vy) < 8) {
    b.still += dt;
    if (b.still > 1.2) Object.assign(b, { vx: (Math.random() - 0.5) * 140, vy: -60, still: 0 });
  } else b.still = 0;
  if (sb.get().turn === 'yuki') yukiFlips(dt);
}

/* ---------- drawing ---------- */
let cv: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let raf = 0;
let last = 0;
let simLeft = 0;

function fit() {
  if (!cv || !ctx) return;
  const dpr = Math.min(3, window.devicePixelRatio || 1);
  cv.width = W * dpr;
  cv.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
function draw(c: CanvasRenderingContext2D, dt: number) {
  c.clearRect(0, 0, W, H);
  c.fillStyle = '#3a2416';
  c.fillRect(0, 0, W, H);
  c.save();
  c.beginPath();
  c.moveTo(8, H);
  c.lineTo(8, ARC.y);
  c.arc(ARC.x, ARC.y, ARC.r, Math.PI, 0);
  c.lineTo(RIGHT_X, H);
  c.closePath();
  const wood = c.createLinearGradient(0, 0, W, H);
  wood.addColorStop(0, '#f0dcb4');
  wood.addColorStop(0.5, '#e6cc9c');
  wood.addColorStop(1, '#dcbd88');
  c.fillStyle = wood;
  c.fill();
  c.clip();
  c.strokeStyle = '#c9a56c55';
  c.lineWidth = 1;
  for (let y = 10; y < H; y += 9) {
    c.beginPath();
    c.moveTo(0, y + Math.sin(y) * 2);
    c.bezierCurveTo(100, y + 4, 200, y - 4, W, y + Math.cos(y) * 2);
    c.stroke();
  }
  c.textAlign = 'center';
  c.fillStyle = '#c2372f';
  c.font = '700 15px "Hiragino Sans", "Yu Gothic UI", "Noto Sans JP", sans-serif';
  c.fillText('スマートボール', ARC.x, 58);
  /* below the slopes: the drain */
  c.fillStyle = '#5a3a22';
  c.beginPath();
  c.moveTo(8, H - 132);
  c.lineTo(FL_X, H - 70);
  c.lineTo(FL_X, H);
  c.lineTo(8, H);
  c.fill();
  c.beginPath();
  c.moveTo(LANE_X, H - 132);
  c.lineTo(FR_X, H - 70);
  c.lineTo(FR_X, H);
  c.lineTo(LANE_X, H);
  c.fill();
  c.fillStyle = '#2a1a0f';
  c.fillRect(FL_X, DRAIN_Y, FR_X - FL_X, H);
  for (const h of HOLES) {
    c.beginPath();
    c.arc(h.x, h.y, 10, 0, Math.PI * 2);
    c.fillStyle = h.v >= 10 ? '#c2372f' : h.v >= 5 ? '#1d3e5c' : '#2c5a46';
    c.fill();
    c.beginPath();
    c.arc(h.x, h.y, 7, 0, Math.PI * 2);
    c.fillStyle = '#1a0f08';
    c.fill();
    c.fillStyle = '#b45d12';
    c.font = '800 11px system-ui, sans-serif';
    c.fillText(String(h.v), h.x, h.y - 15);
  }
  for (const k of BUMPERS) {
    k.lit = Math.max(0, k.lit - dt);
    c.beginPath();
    c.arc(k.x, k.y, k.r, 0, Math.PI * 2);
    c.fillStyle = k.lit ? '#ffd27a' : '#c2372f';
    c.fill();
    c.lineWidth = 3;
    c.strokeStyle = '#fff6e0';
    c.stroke();
    c.beginPath();
    c.arc(k.x, k.y, 5, 0, Math.PI * 2);
    c.fillStyle = '#fff6e0';
    c.fill();
  }
  for (const p of pins) {
    c.beginPath();
    c.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    c.fillStyle = '#b8892c';
    c.fill();
    c.beginPath();
    c.arc(p.x - 0.7, p.y - 0.7, 0.9, 0, Math.PI * 2);
    c.fillStyle = '#ffe9a8';
    c.fill();
  }
  /* lane and plunger */
  c.fillStyle = '#d4b37c';
  c.fillRect(LANE_X, LANE_TOP, RIGHT_X - LANE_X, H);
  const pull = power * 20;
  c.fillStyle = '#7d8995';
  c.fillRect(LANE_X + 3, PLUNGER_Y + R + pull, RIGHT_X - LANE_X - 6, 4);
  c.strokeStyle = '#5b6875';
  c.lineWidth = 1.2;
  c.beginPath();
  for (let i = 0; i <= 6; i++)
    c.lineTo(
      i % 2 ? RIGHT_X - 3 : LANE_X + 3,
      PLUNGER_Y + R + 4 + pull + i * ((H - PLUNGER_Y - R - 4 - pull) / 6),
    );
  c.stroke();
  c.restore();
  c.strokeStyle = '#8a5a2b';
  c.lineWidth = 2;
  for (const s of segs) {
    c.beginPath();
    c.moveTo(s.x1, s.y1);
    c.lineTo(s.x2, s.y2);
    c.stroke();
  }
  const dark = !!ball && ball.t > ball.limit;
  for (const f of Object.values(flips)) {
    const tx = f.px + FLIP_LEN * Math.cos(f.ang);
    const ty = f.py + FLIP_LEN * Math.sin(f.ang);
    c.lineCap = 'round';
    c.lineWidth = 12;
    c.strokeStyle = dark ? '#7d8995' : '#1d3e5c';
    c.beginPath();
    c.moveTo(f.px, f.py);
    c.lineTo(tx, ty);
    c.stroke();
    c.lineWidth = 4;
    c.strokeStyle = dark ? '#b9c3cc' : '#c2372f';
    c.beginPath();
    c.moveTo(f.px, f.py);
    c.lineTo(tx, ty);
    c.stroke();
    c.beginPath();
    c.arc(f.px, f.py, 3, 0, Math.PI * 2);
    c.fillStyle = '#e9a23b';
    c.fill();
  }
  /* the power gauge beside the lane */
  if (ball && ball.state === 'ready') {
    c.fillStyle = '#ffffff33';
    c.fillRect(RIGHT_X + 2, LANE_TOP + 40, 5, 200);
    const h = 200 * power;
    c.fillStyle = power > 0.85 ? '#c2372f' : power > 0.4 ? '#e9a23b' : '#8ecdf2';
    c.fillRect(RIGHT_X + 2, LANE_TOP + 240 - h, 5, h);
  }
  /* time left on this ball */
  if (ball && ball.state !== 'ready' && sb.get().phase === 'play') {
    const left = Math.max(0, ball.limit - ball.t);
    c.fillStyle = left < 6 ? '#c2372f' : '#f0dcb4';
    c.font = '700 11px system-ui, sans-serif';
    c.fillText(left > 0 ? Math.ceil(left) + 's' : 'TIME', (FL_X + FR_X) / 2, H - 2);
  }
  if (ball && ball.state !== 'done') {
    const x = ball.x;
    const y = ball.y + (ball.state === 'ready' ? power * 20 : 0);
    const r = ball.state === 'held' ? R * 0.8 : R;
    c.beginPath();
    c.arc(x + 1.5, y + 2, r, 0, Math.PI * 2);
    c.fillStyle = '#00000033';
    c.fill();
    const g = c.createRadialGradient(x - r * 0.4, y - r * 0.4, 1, x, y, r);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.6, '#e4ecf2');
    g.addColorStop(1, '#a9b8c4');
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fillStyle = g;
    c.fill();
  }
  for (let i = pops.length - 1; i >= 0; i--) {
    const p = pops[i]!;
    p.t += dt;
    if (p.t > 1.1) {
      pops.splice(i, 1);
      continue;
    }
    c.globalAlpha = Math.max(0, 1 - p.t / 1.1);
    c.font = '800 18px system-ui, sans-serif';
    c.lineWidth = 4;
    c.strokeStyle = '#ffffff';
    c.strokeText(p.text, p.x, p.y - p.t * 24);
    c.fillStyle = '#c2372f';
    c.fillText(p.text, p.x, p.y - p.t * 24);
    c.globalAlpha = 1;
  }
}
function frame(now: number) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  /* the gauge rises for a second, falls for a second, and goes on while held */
  if (charging) {
    chargeT += dt;
    const ph = chargeT % 2;
    power = ph <= 1 ? ph : 2 - ph;
  }
  if (ball && (ball.state === 'flying' || ball.state === 'held')) {
    simLeft += sb.get().turn === 'yuki' ? dt * YUKI_SPEED : dt;
    while (simLeft >= STEP && ball && (ball.state === 'flying' || ball.state === 'held')) {
      step(STEP);
      simLeft -= STEP;
    }
  } else {
    simLeft = 0;
    moveFlippers(dt);
  }
  if (ctx) draw(ctx, dt);
  raf = requestAnimationFrame(frame);
}

/* ---------- input ---------- */
const mine = () => {
  const s = sb.get();
  return s.phase === 'play' && s.turn === 'me' && !!ball;
};
const sideOf = (k: string): Side | null =>
  k === 'ArrowLeft' || k === 'z' || k === 'Z'
    ? 'left'
    : k === 'ArrowRight' || k === '/'
      ? 'right'
      : null;
function keydown(e: KeyboardEvent) {
  if (!mine() || e.repeat) return;
  const side = sideOf(e.key);
  if (side) {
    e.preventDefault();
    flip(side, true);
  } else if (e.key === ' ' && ball?.state === 'ready') {
    e.preventDefault();
    charge(true);
  }
}
function keyup(e: KeyboardEvent) {
  if (!mine()) return;
  const side = sideOf(e.key);
  if (side) {
    e.preventDefault();
    flip(side, false);
  } else if (e.key === ' ' && charging) {
    e.preventDefault();
    charge(false);
  }
}
/* a tap on the table: the left half flips left, the right half right */
const touching = new Map<number, Side>();
function pointerdown(e: PointerEvent) {
  if (!mine() || !cv || ball?.state === 'ready') return;
  e.preventDefault();
  const r = cv.getBoundingClientRect();
  const side: Side = e.clientX - r.left < r.width / 2 ? 'left' : 'right';
  touching.set(e.pointerId, side);
  flip(side, true);
}
function pointerup(e: PointerEvent) {
  const side = touching.get(e.pointerId);
  if (!side) return;
  touching.delete(e.pointerId);
  flip(side, false);
}

/* ---------- what the screen calls ---------- */
export function attach(canvas: HTMLCanvasElement, end: (won: boolean) => void) {
  cv = canvas;
  ctx = canvas.getContext('2d');
  onEnd = end;
  fit();
  addEventListener('resize', fit);
  addEventListener('keydown', keydown);
  addEventListener('keyup', keyup);
  canvas.addEventListener('pointerdown', pointerdown);
  canvas.addEventListener('pointerup', pointerup);
  canvas.addEventListener('pointercancel', pointerup);
  last = performance.now();
  raf = requestAnimationFrame(frame);
}
export function detach() {
  cancelAnimationFrame(raf);
  removeEventListener('resize', fit);
  removeEventListener('keydown', keydown);
  removeEventListener('keyup', keyup);
  if (cv) {
    cv.removeEventListener('pointerdown', pointerdown);
    cv.removeEventListener('pointerup', pointerup);
    cv.removeEventListener('pointercancel', pointerup);
  }
  cv = ctx = null;
  for (const id of timers) clearTimeout(id);
  timers.clear();
  ball = null;
  charging = false;
}
/** a fresh match; `rematch` is the one replay after the first */
export function reset(rematch = false) {
  for (const id of timers) clearTimeout(id);
  timers.clear();
  ball = null;
  charging = false;
  power = 0;
  sb.set({ ...SB_START, muted: sb.get().muted, rematch, line: rematch ? 'practice' : 'intro' });
}
export function start() {
  audio();
  sb.set({ phase: 'play', turn: 'me' });
  nextBall();
}
export function flip(side: Side, down: boolean) {
  if (down && !mine()) return;
  flips[side].held = down;
  if (down && sb.get().flipTip) set({ flipTip: false });
}
export function charge(down: boolean) {
  if (down) {
    if (!mine() || ball?.state !== 'ready') return;
    audio();
    charging = true;
    chargeT = 0;
  } else release();
}
export function toggleMute() {
  sb.set((s) => ({ muted: !s.muted }));
}
/** e2e and render checks: end the match at once with this result */
export function settle(won: boolean) {
  for (const id of timers) clearTimeout(id);
  timers.clear();
  ball = null;
  sb.set({ phase: 'end', me: [won ? 3 : 1], yuki: [won ? 1 : 3], cur: 0, ready: false });
  onEnd(won);
}
