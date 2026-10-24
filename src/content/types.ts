import type { Lang } from '../domain/types';

export type L3 = Record<Lang, string>;

export interface Cut {
  jp: string;
  /** Scene note for the artist. Not rendered. */
  s: string;
}
export interface Expression {
  jp: string;
  rd: string;
  g: L3;
}
export interface Lesson {
  id: string;
  lv: number;
  vn?: boolean;
  t: L3;
  d: L3;
  cuts: Cut[];
  ex: Expression[];
}
export type Route = 'osaka' | 'kyoto';
export interface Ending {
  id: string;
  route: Route | 'both';
  best: boolean;
  t: L3;
  jp: string;
  s: string;
  n: L3;
}
export interface VnOption {
  jp: string;
  ok: boolean;
  fb: L3;
}
export interface VnScene {
  s: string;
  jp: string;
  opts: VnOption[];
}
export interface VnRoute {
  name: L3;
  blurb: L3;
  scenes: VnScene[];
}
