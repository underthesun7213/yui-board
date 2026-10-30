import type { MtFbKey, MtPhrase, MtTip, MtTool } from '../content/matcha';
import { createStore } from './store';

/* 아야노 미니게임 (level 8, Kyoto scene 5). The table — tools, tea, milk and
   the player's hand — lives in minigames/matcha.ts, outside React; this is
   what the screen shows around it. */
export type MtStep =
  'intro' | 'tools' | 'powder' | 'water' | 'whisk' | 'base' | 'art' | 'serve' | 'end';
export const MT_STEPS: MtStep[] = [
  'intro',
  'tools',
  'powder',
  'water',
  'whisk',
  'base',
  'art',
  'serve',
  'end',
];
/** the stage number on the bar; intro and end have none */
export const MT_STAGE: Partial<Record<MtStep, number>> = {
  tools: 1,
  powder: 2,
  water: 2,
  whisk: 3,
  base: 4,
  art: 5,
  serve: 6,
};

export interface MtFb {
  k: MtFbKey;
  /** ml, scoops or per cent, for the heading */
  n?: number;
  /** quiz: the tool asked for, and the one tapped by mistake */
  tool?: MtTool;
  hit?: MtTool;
}
export interface MtMeter {
  /** 0…1 filled */
  v: number;
  /** the right band, 0…1, when there is one */
  lo?: number;
  hi?: number;
  over?: boolean;
  k: 'ml' | 'mlMore' | 'froth' | 'accuracy';
  n: number;
  a?: number;
}
export interface Mt {
  step: MtStep;
  /** intro and serve: the right reply picked, and the wrong ones tried */
  picked: number | null;
  wrong: number[];
  /** tools: which question (0 or 1) */
  quiz: number;
  /** the step's explanation or result under the table */
  fb: MtFb | null;
  meter: MtMeter | null;
  /** powder: scoops in the bowl */
  scoops: number;
  /** the step is finished: Next shows */
  done: boolean;
  /** latte art missed: try again or serve; a second miss ends with her line */
  retry: boolean;
  last: boolean;
  tries: number;
  /** the heart was drawn: the achievement is hers */
  got: boolean;
  tip: MtTip | null;
  said: MtPhrase[];
  muted: boolean;
}
export const MT_START: Mt = {
  step: 'intro',
  picked: null,
  wrong: [],
  quiz: 0,
  fb: null,
  meter: null,
  scoops: 0,
  done: false,
  retry: false,
  last: false,
  tries: 0,
  got: false,
  tip: null,
  said: [],
  muted: false,
};
export const mt = createStore<Mt>(MT_START);
