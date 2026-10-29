import type { Drink, Line } from '../content/yuki-minigame';
import { createStore } from './store';

/* 유우키 미니게임: where the player is and what is on the table */
export type YukiStep = 'drink' | 'order' | 'count' | 'eat' | 'bill' | 'pay' | 'leave' | 'end';
export const YUKI_STEPS: YukiStep[] = [
  'drink',
  'order',
  'count',
  'eat',
  'bill',
  'pay',
  'leave',
  'end',
];

export interface Skewer {
  id: string;
  /** 2 untouched, 1 after a bite, 0 eaten */
  bites: number;
  dip: boolean;
}
export interface Pop {
  id: number;
  text: string;
  x: number;
  y: number;
  bad: boolean;
}
export interface Yuki {
  step: YukiStep;
  /** the right answer picked on this step, if any */
  picked: number | null;
  /** wrong answers tried on this step */
  wrong: number[];
  drink: Drink | null;
  order: Record<string, number>;
  plate: Skewer[];
  sel: number;
  warned: number;
  /** Yuki's teasing picture after a double dip */
  tease: boolean;
  said: Line[];
  pops: Pop[];
}
export const YUKI_START: Yuki = {
  step: 'drink',
  picked: null,
  wrong: [],
  drink: null,
  order: {},
  plate: [],
  sel: 0,
  warned: 0,
  tease: false,
  said: [],
  pops: [],
};
export const yuki = createStore<Yuki>(YUKI_START);
