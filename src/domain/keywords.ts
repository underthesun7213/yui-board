/* Place keywords (owner, 2026-11-07): a fixed list, translated in
   src/content/keywords.ts. The database holds the same list and rules
   (app.clean_keywords, migration 20261107000290); a unit test checks the two
   agree. */
export const KEYWORDS = [
  'cheap',
  'late',
  'english',
  'card',
  'cash_only',
  'solo',
  'groups',
  'vegetarian',
  'halal',
  'study',
  'takeout',
  'photo',
  'free',
  'bike',
] as const;
export type Keyword = (typeof KEYWORDS)[number];
export const MAX_KEYWORDS = 3;

const OPPOSITE: Partial<Record<Keyword, Keyword>> = { card: 'cash_only', cash_only: 'card' };
const KNOWN = new Set<string>(KEYWORDS);

/** Only the known ones, in the list's order, without repeats. */
export const knownKeywords = (k: readonly string[] | undefined): Keyword[] =>
  KEYWORDS.filter((x) => k?.includes(x));

/** The server's rule: known, at most three, not Card OK with Cash only. */
export function keywordsOk(k: readonly string[]): boolean {
  if (k.some((x) => !KNOWN.has(x))) return false;
  const list = knownKeywords(k);
  return list.length <= MAX_KEYWORDS && !(list.includes('card') && list.includes('cash_only'));
}

/** Picks or drops one; picking Card OK drops Cash only and the other way
    round. A fourth is not added. */
export function toggleKeyword(list: readonly Keyword[], k: Keyword): Keyword[] {
  if (list.includes(k)) return list.filter((x) => x !== k);
  const next = list.filter((x) => x !== OPPOSITE[k]);
  return next.length >= MAX_KEYWORDS ? [...list] : knownKeywords([...next, k]);
}
