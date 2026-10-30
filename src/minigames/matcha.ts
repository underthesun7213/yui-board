/* The matcha table (아야노 미니게임, level 8, Kyoto scene 4), outside React
   like the smart-ball table: the player's hand on the canvas, the tea in the
   bowl and the cup, the scoring, and a few synthesised sounds. It writes what
   the screen shows to the `mt` store; MatchaGame.tsx shows the rest, and
   matcha-draw.ts paints the table. Prototype: docs/06-design/minigames/ayano-matcha. */
import {
  MT_PHRASES,
  MT_QUIZ,
  type MtFbKey,
  type MtPhrase,
  type MtTip,
  type MtTool,
} from '../content/matcha';
import { MT_START, MT_STEPS, mt, type MtMeter, type MtStep } from '../state/matcha';
import { draw, freshTea, prepare, type Drag, type Held, type Table } from './matcha-draw';
import {
  ART,
  CUP,
  H,
  SPOT,
  W,
  accuracy,
  arc,
  artGrade,
  artPath,
  distToPath,
  hitTool,
  inVessel,
  powderGrade,
  traceStep,
  wPath,
  whiskGrade,
  type Pt,
  type Trace,
  type Vessel,
} from './matcha-geo';

/* ---------- sound: WebAudio blips and noise, started by a tap ---------- */
let ac: AudioContext | null = null;
function audio() {
  if (mt.get().muted) return null;
  try {
    ac = ac ?? new AudioContext();
  } catch {
    return null;
  }
  if (ac.state === 'suspended') void ac.resume();
  return ac;
}
function tone(
  f: number,
  at: number,
  dur: number,
  type: OscillatorType = 'sine',
  vol = 0.06,
  f2?: number,
) {
  const a = audio();
  if (!a) return;
  const o = a.createOscillator();
  const gn = a.createGain();
  const t0 = a.currentTime + at;
  o.type = type;
  o.frequency.setValueAtTime(f, t0);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
  gn.gain.setValueAtTime(vol, t0);
  gn.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(gn).connect(a.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}
function noise(dur: number, vol: number, freq: number, kind: BiquadFilterType = 'bandpass') {
  const a = audio();
  if (!a) return;
  const n = Math.floor(a.sampleRate * dur);
  const buf = a.createBuffer(1, n, a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  const s = a.createBufferSource();
  const f = a.createBiquadFilter();
  const gn = a.createGain();
  const t0 = a.currentTime;
  s.buffer = buf;
  f.type = kind;
  f.frequency.value = freq;
  gn.gain.setValueAtTime(vol, t0);
  gn.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  s.connect(f).connect(gn).connect(a.destination);
  s.start(t0);
}
const sfx = {
  blip: () => tone(1200 + Math.random() * 200, 0, 0.02, 'triangle', 0.025),
  ok: () => {
    tone(660, 0, 0.1, 'triangle', 0.07);
    tone(990, 0.09, 0.2, 'triangle', 0.07);
  },
  ng: () => {
    tone(330, 0, 0.16, 'triangle', 0.06, 250);
    tone(250, 0.14, 0.22, 'triangle', 0.06, 200);
  },
  scoop: () => {
    noise(0.12, 0.05, 2500);
    tone(900, 0.05, 0.05, 'sine', 0.03);
  },
  swish: () => noise(0.09, 0.06, 3200 + Math.random() * 800, 'highpass'),
  pour: () => noise(0.16, 0.035, 700 + Math.random() * 300),
  chime: () => [784, 988, 1175, 1568].forEach((f, i) => tone(f, i * 0.11, 0.5, 'sine', 0.05)),
  clack: () => {
    tone(220, 0, 0.05, 'square', 0.03);
    noise(0.05, 0.05, 1500);
  },
};

/* ---------- the table ---------- */
const T: Table = {
  arrive: 0,
  bowl: freshTea(),
  cup: freshTea(),
  lid: 0,
  drag: null,
  hint: null,
  labels: new Set(),
  mark: null,
  quiz: false,
  scoop: null,
  whisk: null,
  trace: false,
  demo: null,
};

/* What the hand can pick up on this step, and what it does. `anywhere`: the
   grab need not start on the tool. */
interface Hold {
  tool: Held;
  anywhere?: boolean;
  start?(d: Drag): void;
  move?(d: Drag): void;
  tick?(dt: number, d: Drag): void;
  release?(d: Drag): void;
}
let hold: Hold | null = null;
let scoopDone: (() => void) | null = null;

/* each step has its own generation: a timer left from the last one does nothing */
let gen = 0;
const timers = new Set<ReturnType<typeof setTimeout>>();
function later(ms: number, fn: () => void) {
  const my = gen;
  const id = setTimeout(() => {
    timers.delete(id);
    if (my === gen) fn();
  }, ms);
  timers.add(id);
}
let tipTimer: ReturnType<typeof setTimeout> | undefined;
function tip(k: MtTip) {
  mt.set({ tip: k });
  clearTimeout(tipTimer);
  tipTimer = setTimeout(() => mt.set({ tip: null }), 2600);
}
const fb = (k: MtFbKey, extra: { n?: number; tool?: MtTool; hit?: MtTool } = {}) =>
  mt.set({ fb: { k, ...extra } });
const meter = (m: MtMeter | null) => mt.set({ meter: m });
function remember(p: MtPhrase) {
  mt.set((s) => (s.said.some((x) => x.jp === p.jp) ? {} : { said: [...s.said, p] }));
}
let onHeart: () => void = () => {};
const calm = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

function demo(pts: Pt[], keep = false, ms = 2000) {
  T.demo = { pts, t0: performance.now(), ms, every: 5000, keep };
}
function pourSound(d: Drag & { acc?: number }, dt: number) {
  d.acc = (d.acc ?? 0) + dt;
  if (d.acc > 0.16) {
    d.acc = 0;
    sfx.pour();
  }
}

/* ---------- pouring water: drag the pitcher over the vessel; it pours there ---------- */
interface Pour {
  into: Vessel;
  lo: number;
  hi: number;
  max: number;
  rate: number;
  how: MtFbKey;
  over: MtFbKey;
  then?: () => void;
}
function pourStep(o: Pour) {
  const v = o.into === 'cup' ? T.cup : T.bowl;
  const show = (k: MtMeter['k'] = 'ml') =>
    meter({
      v: v.water / o.max,
      lo: o.lo / o.max,
      hi: o.hi / o.max,
      over: v.water > o.hi,
      k,
      n: Math.round(v.water),
    });
  fb(o.how);
  show();
  const to = o.into === 'cup' ? CUP : SPOT.chawan;
  demo(arc(SPOT.yuzamashi, { x: to.x + 10, y: to.y - 10 }, 50));
  T.hint = 'yuzamashi';
  hold = {
    tool: 'yuzamashi',
    start() {
      T.hint = null;
      if (mt.get().fb?.k === o.over) fb(o.how);
    },
    tick(dt, d) {
      d.pouring = inVessel(d, o.into) && v.water < o.max;
      if (!d.pouring) return;
      v.water = Math.min(o.max, v.water + dt * o.rate);
      pourSound(d, dt);
      show();
    },
    release() {
      if (!v.water) return;
      if (v.water > o.hi) {
        sfx.ng();
        fb(o.over);
        v.water = 0;
        show();
      } else if (v.water >= o.lo) {
        sfx.ok();
        hold = null;
        fb('pourOk', { n: Math.round(v.water) });
        if (o.then) later(700, o.then);
        else mt.set({ done: true });
      } else show('mlMore');
    },
  };
}

/* ---------- whisking along the dashed W ----------
   Accuracy is how much of the whisk's travel stayed near the W; froth only
   rises from travel near it, faster for quick strokes. Ayano speaks up when
   the whisk keeps wandering off. */
interface Whisk {
  into: Vessel;
  goal: number;
  trace: Trace;
  recent: [boolean, number][];
  hintAt: number;
  swishAt: number;
  done: (acc: number) => void;
}
let whisk: Whisk | null = null;
const tea = (v: Vessel) => (v === 'cup' ? T.cup : T.bowl);
function showWhisk() {
  if (!whisk) return;
  const v = tea(whisk.into);
  meter({ v: v.foam, k: 'froth', n: Math.round(v.foam * 100), a: Math.round(v.acc * 100) });
}
function addFoam(amount: number) {
  if (!whisk) return;
  const v = tea(whisk.into);
  v.foam = Math.min(1, v.foam + amount);
  showWhisk();
  if (v.foam >= 1) {
    const w = whisk;
    whisk = null;
    T.whisk = null;
    hold = null;
    T.drag = null;
    w.done(v.acc);
  }
}
function whiskStep(into: Vessel, goal: number, done: (acc: number) => void) {
  const v = tea(into);
  v.foam = 0;
  v.acc = 1;
  whisk = { into, goal, trace: { hit: 0, miss: 0 }, recent: [], hintAt: 0, swishAt: 0, done };
  T.whisk = into;
  fb('whisk');
  showWhisk();
  demo(arc(SPOT.chasen, wPath(into)[0]!, 40));
  let last: (Pt & { t: number }) | null = null;
  hold = {
    tool: 'chasen',
    anywhere: true,
    start(d) {
      last = { x: d.x, y: d.y, t: performance.now() };
    },
    move(d) {
      const w = whisk;
      if (!w || !last) return;
      const now = performance.now();
      const dist = Math.hypot(d.x - last.x, d.y - last.y);
      const secs = Math.max(0.008, (now - last.t) / 1000);
      last = { x: d.x, y: d.y, t: now };
      if (dist < 0.5) return;
      const ri = into === 'cup' ? CUP.ri : 124;
      const near = distToPath(d, wPath(into)) < Math.max(16, ri * 0.17);
      traceStep(w.trace, near, dist);
      w.recent.push([near, dist]);
      if (w.recent.length > 40) w.recent.shift();
      v.acc = accuracy(w.trace);
      const speed = dist / secs;
      if (now - w.swishAt > 90 && speed > 250) {
        w.swishAt = now;
        sfx.swish();
      }
      const rd = w.recent.reduce((s, [, x]) => s + x, 0);
      const rh = w.recent.reduce((s, [n, x]) => s + (n ? x : 0), 0);
      if (rd > 260 && rh / rd < 0.45 && now - w.hintAt > 4500) {
        w.hintAt = now;
        tip('w');
      }
      if (near) addFoam((dist / w.goal) * (speed > 500 ? 1 : speed > 220 ? 0.6 : 0.3));
      else showWhisk();
    },
  };
}

/* ---------- each step's table ---------- */
function enter(step: MtStep) {
  gen++;
  for (const id of timers) clearTimeout(id);
  timers.clear();
  hold = null;
  whisk = null;
  scoopDone = null;
  Object.assign(T, {
    drag: null,
    hint: null,
    mark: null,
    quiz: false,
    scoop: null,
    whisk: null,
    trace: false,
    demo: null,
  });
  T.labels = new Set();
  meter(null);
  STEP[step]();
}

const STEP: Record<MtStep, () => void> = {
  intro() {
    T.arrive = calm() ? 1 : 0;
    T.bowl = freshTea();
    T.cup = freshTea();
  },
  tools() {
    T.quiz = true;
    fb('quiz', { tool: MT_QUIZ[mt.get().quiz] });
  },
  powder() {
    T.bowl = freshTea();
    mt.set({ scoops: 0 });
    fb('scoop');
    demo(
      [
        ...arc(SPOT.chashaku, SPOT.natsume, 40),
        ...arc(SPOT.natsume, { x: 280, y: 355 }, 50).slice(1),
      ],
      true,
      2400,
    );
    T.hint = 'chashaku';
    hold = {
      tool: 'chashaku',
      start() {
        T.hint = null;
      },
      tick(dt, d) {
        const dd = d as Drag & { wait?: number };
        if (d.dig && !d.loaded) {
          dd.wait = (dd.wait ?? 0) + dt;
          if (dd.wait > 0.3) {
            d.loaded = true;
            dd.wait = 0;
            sfx.scoop();
          }
        }
        const b = SPOT.chawan;
        const r = Math.hypot(d.x - b.x, d.y - b.y);
        if (d.loaded && r < 124 * 0.8 && T.bowl.piles.length < 4) {
          /* tipped into the bowl */
          const a = Math.atan2(d.y - b.y, d.x - b.x);
          const rr = Math.min(124 * 0.3, r);
          T.bowl.piles.push({
            x: Math.cos(a) * rr,
            y: Math.sin(a) * rr,
            s: 30,
            k: T.bowl.piles.length * 1.7,
          });
          d.loaded = false;
          sfx.scoop();
          mt.set({ scoops: T.bowl.piles.length });
        }
      },
    };
  },
  water() {
    pourStep({
      into: 'bowl',
      lo: 60,
      hi: 80,
      max: 110,
      rate: 24,
      how: 'pourBowl',
      over: 'overBowl',
    });
  },
  whisk() {
    whiskStep('bowl', 3000, (acc) => {
      remember(MT_PHRASES.tateru);
      const k = whiskGrade(acc);
      if (k === 'whiskLively') sfx.ng();
      else sfx.ok();
      fb(k, { n: Math.round(acc * 100) });
      meter(null);
      mt.set({ done: true });
    });
  },
  base() {
    T.cup = freshTea();
    fb('pourCup');
    const two = () => {
      T.scoop = 0;
      scoopDone = () => {
        T.cup.piles.push({
          x: T.cup.piles.length ? 8 : -8,
          y: 0,
          s: 22,
          k: T.cup.piles.length * 2,
        });
        sfx.scoop();
        if (T.cup.piles.length < 2) two();
        else
          pourStep({
            into: 'cup',
            lo: 30,
            hi: 45,
            max: 70,
            rate: 16,
            how: 'pourCup',
            over: 'overCup',
            then: () =>
              whiskStep('cup', 1400, () => {
                sfx.ok();
                fb('baseOk');
                meter(null);
                mt.set({ done: true });
              }),
          });
      };
    };
    two();
  },
  art() {
    const c = T.cup;
    Object.assign(c, { milk: 0, dot: 0, cut: null, art: null });
    fb('artFill');
    demo(arc(SPOT.pitcher, { x: CUP.x, y: CUP.y }, 30));
    T.hint = 'pitcher';
    const pts = artPath();
    const spiralEnd = ART.n;
    const tol = 15;
    let phase: 'fill' | 'trace' | 'done' = 'fill';
    let prog = 0;
    const tr: Trace = { hit: 0, miss: 0 };
    const recent: [boolean, number][] = [];
    let hintAt = 0;
    let last: Pt | null = null;
    const judge = (acc: number) => {
      hold = null;
      phase = 'done';
      T.trace = false;
      T.drag = null;
      meter(null);
      const k = artGrade(acc);
      c.art = { off: k === 'artMiss' ? 18 : (1 - acc) * 10 };
      c.cut = null;
      later(500, () => {
        const n = Math.round(acc * 100);
        if (k !== 'artMiss') {
          sfx.chime();
          remember(MT_PHRASES.kawaii);
          fb(k, { n });
          mt.set({ got: true, done: true });
          onHeart();
          return;
        }
        sfx.ng();
        remember(MT_PHRASES.koseiteki);
        fb(k, { n });
        const tries = mt.get().tries + 1;
        mt.set(tries < 2 ? { tries, retry: true } : { tries, last: true, done: true });
      });
    };
    /* one drag, scored like the whisk: accuracy is how much of the pitcher's
       travel stayed near the dashed line. Progress only moves forward along
       the line, a few points at a time, so the spiral's rings can't be
       skipped. Lifting the finger just pauses. */
    hold = {
      tool: 'pitcher',
      anywhere: true,
      start(d) {
        T.hint = null;
        d.style = phase === 'fill' ? 'high' : 'low';
        last = null;
      },
      tick(dt, d) {
        if (phase === 'fill') {
          d.style = 'high';
          d.pouring = inVessel(d, 'cup');
          if (!d.pouring) return;
          c.milk = Math.min(0.8, c.milk + dt * 0.22);
          pourSound(d, dt);
          if (c.milk >= 0.8) {
            phase = 'trace';
            T.trace = true;
            sfx.blip();
            fb('artTrace');
            meter({ v: 0, k: 'accuracy', n: 0, a: 100 });
          }
          return;
        }
        if (phase !== 'trace') return;
        d.style = prog > spiralEnd ? 'cut' : 'low';
        d.pouring = inVessel(d, 'cup');
        if (!d.pouring) {
          last = null;
          return;
        }
        pourSound(d, dt);
        if (!last) {
          last = { x: d.x, y: d.y };
          return;
        }
        const dist = Math.hypot(d.x - last.x, d.y - last.y);
        last = { x: d.x, y: d.y };
        if (dist < 0.5) return;
        const near = distToPath(d, pts) < tol;
        if (prog || near) traceStep(tr, near, dist);
        recent.push([near, dist]);
        if (recent.length > 40) recent.shift();
        for (let i = Math.min(pts.length - 1, prog + 6); i > prog; i--) {
          const p = pts[i]!;
          if (Math.hypot(d.x - p.x, d.y - p.y) < tol * 1.4) {
            prog = i;
            break;
          }
        }
        const acc = accuracy(tr);
        meter({ v: prog / (pts.length - 1), k: 'accuracy', n: 0, a: Math.round(acc * 100) });
        c.dot = 8 + ((ART.R - 8) * Math.min(prog, spiralEnd)) / spiralEnd;
        if (prog > spiralEnd) {
          /* the pull-through draws the line it leaves */
          c.cut = [...(c.cut ?? [{ x: CUP.x, y: CUP.y + ART.R }]), { x: d.x, y: d.y }];
        }
        const rd = recent.reduce((s, [, x]) => s + x, 0);
        const rh = recent.reduce((s, [n, x]) => s + (n ? x : 0), 0);
        const now = performance.now();
        if (rd > 200 && rh / rd < 0.45 && now - hintAt > 4500) {
          hintAt = now;
          tip('dash');
        }
        if (prog >= pts.length - 1) judge(acc);
      },
    };
  },
  serve() {},
  end() {},
};

/* ---------- the tool quiz: a tap on the table ---------- */
function tapTool(hit: MtTool | null) {
  const s = mt.get();
  const want = MT_QUIZ[s.quiz]!;
  if (!hit) return;
  if (hit === want) {
    T.mark = { k: hit, ok: true };
    T.labels.add(hit);
    T.quiz = false;
    sfx.ok();
    remember(hit === 'chasen' ? MT_PHRASES.chasen : MT_PHRASES.chashaku);
    fb(hit === 'chasen' ? 'chasenOk' : 'chashakuOk');
    later(1400, () => {
      T.mark = null;
      if (s.quiz + 1 < MT_QUIZ.length) {
        mt.set({ quiz: s.quiz + 1 });
        T.quiz = true;
        fb('quiz', { tool: MT_QUIZ[s.quiz + 1] });
      } else {
        for (const k of Object.keys(SPOT) as (keyof typeof SPOT)[]) T.labels.add(k);
        mt.set({ done: true });
      }
    });
    return;
  }
  T.mark = { k: hit, ok: false };
  T.labels.add(hit);
  sfx.ng();
  fb('toolWrong', { tool: want, hit });
  later(1600, () => {
    if (T.mark?.k === hit) T.mark = null;
    T.labels.delete(hit);
  });
}

/* ---------- the frame loop and the hand ---------- */
let cv: HTMLCanvasElement | null = null;
let raf = 0;
let lastT = 0;
function fit() {
  if (!cv) return;
  const r = cv.getBoundingClientRect();
  const d = Math.min(2, devicePixelRatio || 1);
  cv.width = Math.max(1, Math.round(r.width * d));
  cv.height = Math.max(1, Math.round(r.height * d));
}
function frame(now: number) {
  const dt = Math.min(0.05, (now - lastT) / 1000);
  lastT = now;
  if (T.arrive < 1) T.arrive = Math.min(1, T.arrive + dt * 1.1);
  if (T.scoop !== null) {
    T.scoop += dt * (calm() ? 4 : 1.6);
    if (T.scoop >= 1) {
      T.scoop = null;
      const d = scoopDone;
      scoopDone = null;
      d?.();
    }
  }
  const d = T.drag;
  const n = SPOT.natsume;
  const inCaddy = !!d && d.tool === 'chashaku' && Math.hypot(d.x - n.x, d.y - n.y) < n.r + 6;
  T.lid += ((inCaddy ? 1 : 0) - T.lid) * Math.min(1, dt * 9);
  if (d) {
    d.dig = inCaddy && T.lid > 0.75;
    hold?.tick?.(dt, d);
  }
  if (cv) draw(T, now, cv.width, cv.height);
  raf = requestAnimationFrame(frame);
}
function at(e: PointerEvent): Pt {
  const r = cv!.getBoundingClientRect();
  return { x: ((e.clientX - r.left) * W) / r.width, y: ((e.clientY - r.top) * H) / r.height };
}
let down = false;
function pointerdown(e: PointerEvent) {
  audio();
  const pt = at(e);
  if (T.quiz) {
    tapTool(hitTool(pt));
    return;
  }
  const h = hold;
  if (!h) return;
  const t = SPOT[h.tool];
  const grabbed =
    h.anywhere ||
    (h.tool === 'chashaku'
      ? hitTool(pt, 30) === 'chashaku'
      : Math.hypot(pt.x - t.x, pt.y - t.y) < t.r + 70);
  if (!grabbed) return;
  down = true;
  try {
    cv!.setPointerCapture(e.pointerId);
  } catch {
    /* a synthetic pointer */
  }
  T.drag = { tool: h.tool, ...pt };
  sfx.clack();
  if (T.demo && !T.demo.keep) T.demo = null;
  /* the pitcher stays in hand for the whole latte: later grabs need not find it */
  if (h.tool === 'pitcher') h.anywhere = true;
  h.start?.(T.drag);
}
function pointermove(e: PointerEvent) {
  if (!down || !T.drag) return;
  Object.assign(T.drag, at(e));
  hold?.move?.(T.drag);
}
function pointerup() {
  if (!down) return;
  down = false;
  const d = T.drag;
  const h = hold;
  T.drag = null;
  if (d && h?.release) h.release(d);
}
let lastKey = '';
function keydown(e: KeyboardEvent) {
  if (!whisk || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return;
  e.preventDefault();
  if (e.key === lastKey) return;
  lastKey = e.key;
  addFoam(110 / whisk.goal);
}

/* ---------- what the screen calls ---------- */
export function attach(canvas: HTMLCanvasElement, heart: () => void) {
  cv = canvas;
  onHeart = heart;
  prepare(canvas.getContext('2d')!);
  fit();
  addEventListener('resize', fit);
  addEventListener('keydown', keydown);
  canvas.addEventListener('pointerdown', pointerdown);
  canvas.addEventListener('pointermove', pointermove);
  canvas.addEventListener('pointerup', pointerup);
  canvas.addEventListener('pointercancel', pointerup);
  enter(mt.get().step);
  lastT = performance.now();
  raf = requestAnimationFrame(frame);
}
export function detach() {
  cancelAnimationFrame(raf);
  removeEventListener('resize', fit);
  removeEventListener('keydown', keydown);
  if (cv) {
    cv.removeEventListener('pointerdown', pointerdown);
    cv.removeEventListener('pointermove', pointermove);
    cv.removeEventListener('pointerup', pointerup);
    cv.removeEventListener('pointercancel', pointerup);
  }
  cv = null;
  gen++;
  for (const id of timers) clearTimeout(id);
  timers.clear();
  hold = null;
  whisk = null;
  down = false;
  T.drag = null;
}
/** a fresh game from the tea house's door */
export function reset() {
  mt.set({ ...MT_START, muted: mt.get().muted });
  T.bowl = freshTea();
  T.cup = freshTea();
}
/** the step's Next */
export function next() {
  const s = mt.get();
  const step = MT_STEPS[Math.min(MT_STEPS.indexOf(s.step) + 1, MT_STEPS.length - 1)]!;
  mt.set({
    step,
    picked: null,
    wrong: [],
    fb: null,
    meter: null,
    done: false,
    retry: false,
    last: false,
    tip: null,
  });
  if (cv) enter(step);
}
/** powder: the player says the scoops are in */
export function scooped() {
  const k = powderGrade(T.bowl.piles.length);
  fb(k);
  if (k === 'powderOk') {
    sfx.ok();
    hold = null;
    T.demo = null;
    remember(MT_PHRASES.nihai);
    mt.set({ done: true });
    return;
  }
  sfx.ng();
  if (k === 'powderStrong') {
    T.bowl.piles = [];
    mt.set({ scoops: 0 });
  }
}
/** the latte art missed: pour it once more */
export function againArt() {
  mt.set({ retry: false, fb: null });
  enter('art');
}
export function toggleMute() {
  mt.set((s) => ({ muted: !s.muted }));
}
/** e2e: the latte art drawn at once, with this accuracy */
export function settleArt(acc: number) {
  if (mt.get().step !== 'art') return;
  const c = T.cup;
  c.milk = 0.8;
  hold = null;
  T.trace = false;
  const k = artGrade(acc);
  c.art = { off: 0 };
  fb(k, { n: Math.round(acc * 100) });
  if (k !== 'artMiss') {
    mt.set({ got: true, done: true });
    onHeart();
  }
}
