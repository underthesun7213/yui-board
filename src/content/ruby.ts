/* Furigana in content strings (Y-J1): {漢字|かんじ} puts the reading over the
   base text. Every kanji in a Japanese line carries one (a unit test checks).
   Artwork and image alt text use plain(), which drops the readings. */
export type Seg = string | { base: string; rt: string };

const RUBY = /\{([^|{}]+)\|([^|{}]+)\}/g;

export function segments(s: string): Seg[] {
  const out: Seg[] = [];
  let at = 0;
  for (const m of s.matchAll(RUBY)) {
    if (m.index > at) out.push(s.slice(at, m.index));
    out.push({ base: m[1]!, rt: m[2]! });
    at = m.index + m[0].length;
  }
  if (at < s.length) out.push(s.slice(at));
  return out;
}

export const plain = (s: string) => s.replace(RUBY, '$1');
