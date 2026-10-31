/* The fireworks photo: the screen's way to the phone runtime. */
import { ACH_HANABI } from '../content/achievements';
import * as phone from '../minigames/photo';
import { unlock } from './achievements';

/** the canvas is on screen: run the phone there; a good shot of Ayano unlocks her picture */
export const attachPhone = (canvas: HTMLCanvasElement) =>
  phone.attach(canvas, () => unlock(ACH_HANABI));
export const detachPhone = phone.detach;
export const stop = phone.stop;
export const again = phone.again;
