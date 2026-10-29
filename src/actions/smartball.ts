/* The smart-ball match: the screen's way to the table runtime. */
import * as table from '../minigames/smartball';
import { endBall } from './achievements';

/** the canvas is on screen: run the table there; a finished match settles the bet */
export const attachTable = (canvas: HTMLCanvasElement) =>
  table.attach(canvas, (won) => endBall(won ? 'win' : 'lose'));
export const detachTable = table.detach;
export const startMatch = table.start;
export const rematch = () => table.reset(true);
export const resetMatch = () => table.reset(false);
export const flip = table.flip;
export const charge = table.charge;
export const toggleSound = table.toggleMute;
