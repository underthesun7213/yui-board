import type { Lang } from '../domain/types';

export type L3 = Record<Lang, string>;

/** One comic panel (Y-J1). `cap` is a caption box (a place, an action, an
    aside) drawn without brackets; `jp` is the balloon; a panel has at least
    one of them, and the artwork carries them in Japanese. `tr` translates the
    whole panel; the Japanese screen shows no translation line. */
/** Who says a balloon, for its voice (D35): the level's student, another
    woman, another man, or a second man in the same scene. */
export type Who = 'me' | 'f' | 'm' | 'm2';
export interface Panel {
  cap?: string;
  jp?: string;
  /** Required with `jp` (a unit test checks). */
  who?: Who;
  tr: { en: string; ko: string };
  /** Scene note for the artist. Not rendered. */
  s: string;
}
export interface Page {
  panels: [Panel, Panel, Panel, Panel];
}
export interface Expression {
  jp: string;
  rd: string;
  g: L3;
}
interface LessonBase {
  id: string;
  lv: number;
  t: L3;
  d: L3;
  ex: Expression[];
}
/** Levels 1–7: two pages of four panels. */
export interface ComicLesson extends LessonBase {
  vn?: false;
  pages: [Page, Page];
}
/** Level 8: the branching conversation (VnGame). */
export interface VnLesson extends LessonBase {
  vn: true;
}
export type Lesson = ComicLesson | VnLesson;
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
