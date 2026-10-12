import type { Lang } from '../domain/types';
import { en, type Messages } from './en';
import { ja } from './ja';
import { ko } from './ko';

export type { Messages };
export const MESSAGES: Record<Lang, Messages> = { en, ja, ko };
export const LANG_NAME: Record<Lang, string> = { ja: '日本語', en: 'English', ko: '한국어' };
export const LOCALE: Record<Lang, string> = { ja: 'ja-JP', en: 'en-US', ko: 'ko-KR' };

/** Pure: the messages for a language. */
export const t = (lang: Lang): Messages => MESSAGES[lang];

/** Fills {name} placeholders. A missing value is left visible so the render check catches it. */
export const fill = (s: string, vals: Record<string, string | number>) =>
  s.replace(/\{(\w+)\}/g, (m, k: string) => (k in vals ? String(vals[k]) : m));
