import {
  HON,
  MAX_EACH,
  MENU,
  SFX_TEXT,
  TALK,
  UNITS,
  orderOk,
  type Line,
} from '../content/yuki-minigame';
import { ACH_NO_DOUBLE_DIP } from '../content/achievements';
import { yuki, YUKI_STEPS } from '../state/yuki';
import * as plateRt from '../minigames/yuki-plate';
import { unlock } from './achievements';

export function nextYuki() {
  const s = yuki.get();
  const i = YUKI_STEPS.indexOf(s.step);
  const step = YUKI_STEPS[Math.min(i + 1, YUKI_STEPS.length - 1)]!;
  yuki.set({ step, picked: null, wrong: [] });
  /* out of the shop without a second dip: the kushikatsu picture */
  if (step === 'end' && !s.warned) unlock(ACH_NO_DOUBLE_DIP);
}

let popId = 0;
export function pop(text: string, x: number, y: number, bad = false) {
  const p = { id: ++popId, text, x, y, bad };
  yuki.set((s) => ({ pops: [...s.pops, p] }));
  setTimeout(() => yuki.set((s) => ({ pops: s.pops.filter((q) => q.id !== p.id) })), 1100);
}

const remember = (l: Line) =>
  yuki.set((s) => (s.said.some((x) => x.jp === l.jp) ? {} : { said: [...s.said, l] }));

/* A reply on a talk step: a right one ends the step, a wrong one is marked and
   another can be tried. */
export function pickTalk(key: keyof typeof TALK, i: number) {
  const s = yuki.get();
  const o = TALK[key].opts[i];
  if (!o || s.picked !== null || s.wrong.includes(i)) return;
  if (!o.ok) {
    yuki.set({ wrong: [...s.wrong, i] });
    return;
  }
  yuki.set({ picked: i, ...(o.drink ? { drink: o.drink } : {}) });
  remember(o);
  if (o.drink) pop(SFX_TEXT.cart, 50, 82);
}

export function addItem(id: string, n: 1 | -1) {
  const order = { ...yuki.get().order };
  order[id] = Math.max(0, Math.min(MAX_EACH, (order[id] ?? 0) + n));
  yuki.set({ order });
}

export function placeOrder() {
  const s = yuki.get();
  if (!orderOk(s.order, s.drink)) return;
  pop(SFX_TEXT.sent, 50, 82);
  nextYuki();
}

/** the counting blank is about the first skewer on the order */
export const firstOrdered = () => MENU.find((m) => (yuki.get().order[m.id] ?? 0) > 0);

export function pickUnit(i: number) {
  const s = yuki.get();
  const u = UNITS[i];
  const first = firstOrdered();
  if (!u || !first || s.picked !== null || s.wrong.includes(i)) return;
  if (!u.ok) {
    yuki.set({ wrong: [...s.wrong, i] });
    return;
  }
  const n = s.order[first.id] ?? 0;
  remember({
    jp: `${first.ja}を${n}{本|${HON[n]}}{頼|たの}んだよ。`,
    mean: {
      ja: `${first.name.ja}を${n}本頼んだよ。`,
      en: `I ordered ${n} ${first.name.en}.`,
      ko: `${first.name.ko} ${n}개 시켰어.`,
    },
  });
  const plate = MENU.flatMap((m) =>
    Array.from({ length: s.order[m.id] ?? 0 }, () => ({ id: m.id, bites: 2, dip: false })),
  );
  yuki.set({ picked: i, plate, sel: 0 });
  pop(SFX_TEXT.arrived, 50, 30);
}

/* ---------- eating ---------- */
const left = () => yuki.get().plate.filter((k) => k.bites > 0).length;

function update(i: number, patch: Partial<{ bites: number; dip: boolean }>) {
  const plate = yuki.get().plate.map((k, j) => (j === i ? { ...k, ...patch } : k));
  const sel = plate[i]?.bites === 0 ? plate.findIndex((k) => k.bites > 0) : i;
  yuki.set({ plate, sel });
}

let teaseTimer: ReturnType<typeof setTimeout> | undefined;
/* Dipping twice is the one rule of the house: Yuki catches it with a grin.
   Nothing is written over the picture, so his face stays visible. */
export function dipSkewer(i: number) {
  const k = yuki.get().plate[i];
  if (!k || k.bites === 0) return;
  yuki.set({ sel: i });
  if (k.bites === 1) {
    yuki.set((s) => ({ warned: s.warned + 1, tease: true }));
    clearTimeout(teaseTimer);
    teaseTimer = setTimeout(() => yuki.set({ tease: false }), 2200);
    return;
  }
  if (k.dip) {
    pop(SFX_TEXT.already, 50, 60);
    return;
  }
  update(i, { dip: true });
  pop(SFX_TEXT.dip, 50, 60);
}

export function biteSkewer(i: number) {
  const k = yuki.get().plate[i];
  if (!k || k.bites === 0) return;
  pop(k.dip ? SFX_TEXT.yum : SFX_TEXT.munch, 50, 22);
  /* after the first bite the sauce is gone from that end */
  update(i, { bites: k.bites - 1, dip: false });
}

let lastTap = { i: -1, t: 0 };
/** one tap picks a skewer, a second within half a second takes a bite (a
    phone's double tap is slower than a mouse's) */
export function tapSkewer(i: number, now = Date.now()) {
  if (lastTap.i === i && now - lastTap.t < 500) {
    lastTap = { i: -1, t: 0 };
    biteSkewer(i);
    return;
  }
  lastTap = { i, t: now };
  yuki.set({ sel: i });
}

export function eatRest() {
  yuki.set((s) => ({ plate: s.plate.map((k) => ({ ...k, bites: 0 })), sel: -1 }));
}
export function finishEating() {
  if (left() === 0) nextYuki();
}

export function paid() {
  pop(SFX_TEXT.paid, 50, 60);
  nextYuki();
}

/** the plate is on screen: taps and drags on it, outside React (minigames/yuki-plate) */
export const attachPlate = (
  plate: HTMLElement,
  sauce: () => HTMLElement | null,
  ghost: HTMLElement,
) => plateRt.attach(plate, sauce, ghost, { tap: tapSkewer, dip: dipSkewer });
export const detachPlate = plateRt.detach;
