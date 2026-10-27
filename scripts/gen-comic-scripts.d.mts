import type { Ending, Lesson, Route, VnRoute } from '../src/content/types';

/** Types for the unit test that checks the generated scripts in docs/06-design/ are current. */
export const OUT: string;
export const GAME_OUT: string;
export function renderComicScripts(lessons: readonly Lesson[]): string;
export function renderGameScript(
  vn: Record<Route, VnRoute>,
  endings: readonly Ending[],
  bestMisses: number,
): string;
