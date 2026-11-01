/* The kushikatsu plate (the 유우키 미니게임's eating step), outside React like
   the matcha table: one set of native listeners on the whole plate. A tap
   picks a skewer, a second tap takes a bite, a drag carries it to the sauce.
   React only draws the plate and the carried copy (the `held` skewer); the
   copy is moved here, straight in its style, so a drag does not redraw the
   screen. Safari on the iPhone starts its own scroll or zoom on a touch that
   it is allowed to take, which cancels the touch: the plate turns gestures
   off (touch-action: none in the CSS) and, while a skewer is held, its
   touchmove is refused as well. */
import { yuki } from '../state/yuki';

let plate: HTMLElement | null = null;
/** the dish, looked up each time: it leaves the screen while Yuki teases */
let sauce: () => HTMLElement | null = () => null;
let ghost: HTMLElement | null = null;
let on: { tap(i: number): void; dip(i: number): void } = { tap() {}, dip() {} };
let press: { i: number; id: number; x0: number; y0: number; moved: boolean } | null = null;

/** the dish counts a little beyond its edge: a fingertip covers what it aims at */
function overSauce(x: number, y: number) {
  const r = sauce()?.getBoundingClientRect();
  const pad = 24;
  return !!r && x >= r.left - pad && x <= r.right + pad && y >= r.top - pad && y <= r.bottom + pad;
}
function place(x: number, y: number) {
  if (!ghost) return;
  ghost.style.left = `${x}px`;
  ghost.style.top = `${y}px`;
}
function release() {
  press = null;
  sauce()?.classList.remove('hot');
  if (yuki.get().held !== -1) yuki.set({ held: -1 });
}

function pointerdown(e: PointerEvent) {
  if (press || (e.pointerType === 'mouse' && e.button !== 0)) return;
  const k = (e.target as Element | null)?.closest<HTMLButtonElement>('[data-k]');
  if (!k || k.disabled) return;
  const i = Number(k.dataset.k);
  press = { i, id: e.pointerId, x0: e.clientX, y0: e.clientY, moved: false };
  try {
    plate?.setPointerCapture(e.pointerId);
  } catch {
    /* a synthetic pointer */
  }
}
function pointermove(e: PointerEvent) {
  const p = press;
  if (!p || e.pointerId !== p.id) return;
  /* a fingertip wobbles during a tap: a drag starts only past it */
  const slop = e.pointerType === 'mouse' ? 8 : 16;
  if (!p.moved && Math.hypot(e.clientX - p.x0, e.clientY - p.y0) <= slop) return;
  if (!p.moved) {
    p.moved = true;
    yuki.set({ held: p.i, sel: p.i });
  }
  place(e.clientX, e.clientY);
  sauce()?.classList.toggle('hot', overSauce(e.clientX, e.clientY));
}
function pointerup(e: PointerEvent) {
  const p = press;
  if (!p || e.pointerId !== p.id) return;
  release();
  if (p.moved) {
    if (overSauce(e.clientX, e.clientY)) on.dip(p.i);
  } else on.tap(p.i);
}
function pointercancel(e: PointerEvent) {
  if (press && e.pointerId === press.id) release();
}
/* Safari may still try to scroll the page under a held skewer */
function touchmove(e: TouchEvent) {
  if (press) e.preventDefault();
}

export function attach(
  plateEl: HTMLElement,
  sauceEl: () => HTMLElement | null,
  ghostEl: HTMLElement,
  handlers: typeof on,
) {
  detach();
  on = handlers;
  plate = plateEl;
  sauce = sauceEl;
  ghost = ghostEl;
  plate.addEventListener('pointerdown', pointerdown);
  plate.addEventListener('pointermove', pointermove);
  plate.addEventListener('pointerup', pointerup);
  plate.addEventListener('pointercancel', pointercancel);
  plate.addEventListener('touchmove', touchmove, { passive: false });
}
export function detach() {
  if (plate) {
    plate.removeEventListener('pointerdown', pointerdown);
    plate.removeEventListener('pointermove', pointermove);
    plate.removeEventListener('pointerup', pointerup);
    plate.removeEventListener('pointercancel', pointercancel);
    plate.removeEventListener('touchmove', touchmove);
  }
  release();
  plate = ghost = null;
  sauce = () => null;
}
