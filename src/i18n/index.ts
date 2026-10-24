import type { Lang } from '../domain/types';
import { en, type Messages } from './en';

export type { Messages };
export const LANG_NAME: Record<Lang, string> = { ja: '日本語', en: 'English', ko: '한국어' };
export const LOCALE: Record<Lang, string> = { ja: 'ja-JP', en: 'en-US', ko: 'ko-KR' };

/* English ships with the first screen; Japanese and Korean are small chunks
   loaded when chosen (the service worker caches all three for offline). */
const loaded: Partial<Record<Lang, Messages>> = { en };
const loaders: Record<Exclude<Lang, 'en'>, () => Promise<Messages>> = {
  ja: () => import('./ja').then((m) => m.ja),
  ko: () => import('./ko').then((m) => m.ko),
};
export async function loadLang(lang: Lang): Promise<void> {
  if (!loaded[lang] && lang !== 'en') loaded[lang] = await loaders[lang]();
}
export const isLoaded = (lang: Lang) => !!loaded[lang];

/** Pure: the messages for a language (English until that language has loaded). */
export const t = (lang: Lang): Messages => loaded[lang] ?? en;

/** Fills {name} placeholders. A missing value is left visible so the render check catches it. */
export const fill = (s: string, vals: Record<string, string | number>) =>
  s.replace(/\{(\w+)\}/g, (m, k: string) => (k in vals ? String(vals[k]) : m));
