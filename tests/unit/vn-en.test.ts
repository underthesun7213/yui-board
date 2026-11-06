import { describe, expect, it } from 'vitest';
import { ACHIEVEMENTS } from '../../src/content/achievements';
import { ENDINGS } from '../../src/content/endings';
import { VN } from '../../src/content/vn';
import { VN_EN } from '../../src/content/vn-en';

function lines(): string[] {
  const out: string[] = [];
  for (const route of Object.values(VN)) {
    for (const sc of route.scenes) {
      out.push(sc.jp, sc.win ?? '', sc.lose ?? '', ...(sc.more ?? []).map((l) => l.jp));
      for (const o of sc.opts) out.push(o.jp, ...(o.reply ?? []).map((l) => l.jp));
    }
  }
  out.push(...ENDINGS.map((e) => e.jp), ...ACHIEVEMENTS.map((a) => a.jp));
  return [...new Set(out.filter(Boolean))];
}

describe('English for episode 8', () => {
  it('has every line', () => {
    expect(lines().filter((l) => !VN_EN[l]?.trim())).toEqual([]);
  });
  it('has nothing left over from a line that changed', () => {
    const all = new Set(lines());
    expect(Object.keys(VN_EN).filter((k) => !all.has(k))).toEqual([]);
  });
});
