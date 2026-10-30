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
/** which ending a run gets: all right, some right, or almost none */
export type Tier = 'good' | 'normal' | 'bad';
export interface Ending {
  id: string;
  route: Route | 'both';
  tier: Tier;
  t: L3;
  jp: string;
  s: string;
  n: L3;
}
/** a line someone says: the friend of the route, or the shop staff */
export interface VnSay {
  who: 'friend' | 'staff';
  jp: string;
}
/** what the smart-ball match is played for, as agreed in the reply before it */
export type Bet = 'juice' | 'takoyaki';
/** who the photo on the bridge is of: Ayano with the fireworks, or the sky only
    (after a reply that took a photo for yourself and left her out) */
export type Shot = 'friend' | 'sky';
export interface VnOption {
  jp: string;
  ok: boolean;
  fb: L3;
  /** what they say back to this reply */
  reply?: VnSay[];
  /** this reply takes the smart-ball bet, for this */
  bet?: Bet;
  /** this reply unlocks an achievement illustration */
  ach?: string;
  /** this reply decides what the photo game shoots */
  shot?: Shot;
}
/** An achievement illustration: unlocked once, the moment its condition is met. */
export interface Achievement {
  id: string;
  route: Route;
  t: L3;
  /** the friend's line under the picture */
  jp: string;
  /** what the picture shows (the image prompt's scene) */
  s: string;
  n: L3;
}
/** talk: a line and replies to pick (scored). move: walking on, no choice.
    yuki: the 유우키 미니게임. smartball: the smart-ball match. matcha: the 아야노
    미니게임 at the tea house. photo: the fireworks photo on the bridge. */
export type VnKind = 'talk' | 'move' | 'yuki' | 'smartball' | 'matcha' | 'photo';
export interface VnScene {
  kind?: VnKind;
  s: string;
  /** the friend's line; empty when the scene has none */
  jp: string;
  /** further lines before the choice */
  more?: VnSay[];
  /** what happens, for scenes without a choice */
  note?: L3;
  /** smartball: the friend's line when you win and when you lose */
  win?: string;
  lose?: string;
  opts: VnOption[];
}
export interface VnRoute {
  name: L3;
  blurb: L3;
  scenes: VnScene[];
}
