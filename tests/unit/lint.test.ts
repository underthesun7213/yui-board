import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

/* The security rules are only worth having if they fire. */
const eslint = new ESLint();
async function rules(file: string, code: string) {
  const [r] = await eslint.lintText(code, { filePath: file });
  return r!.messages.map((m) => m.ruleId);
}

describe('security lint', () => {
  it('blocks HTML sinks everywhere in src, map included', async () => {
    for (const f of ['src/actions/x.ts', 'src/map/runtime.ts', 'src/map/icons.ts'])
      for (const code of [
        'declare const el: HTMLElement; el.innerHTML = "x";',
        'declare const el: HTMLElement; el["innerHTML"] = "x";',
        'declare const el: HTMLElement; el.insertAdjacentHTML("beforeend", "x");',
        'export const o = { dangerouslySetInnerHTML: { __html: "x" } };',
      ])
        expect(await rules(f, code), `${f}: ${code}`).toContain('no-restricted-syntax');
  });
  it('blocks dangerouslySetInnerHTML in JSX', async () => {
    expect(
      await rules(
        'src/ui/x.tsx',
        'export const X = () => <div dangerouslySetInnerHTML={{ __html: "x" }} />;',
      ),
    ).toContain('react/no-danger');
  });
  it('only lets nodes from layers.ts into Leaflet', async () => {
    const f = 'src/map/runtime.ts';
    expect(await rules(f, 'declare const m: any, p: any; m.bindTooltip(p.name);')).toContain(
      'no-restricted-syntax',
    );
    expect(
      await rules(f, 'declare const m: any, p: any; m.bindPopup(`<b>${p.name}</b>`);'),
    ).toContain('no-restricted-syntax');
    expect(
      await rules(
        f,
        'declare const m: any, p: any, textNode: any; m.bindTooltip(textNode("b", p.name));',
      ),
    ).not.toContain('no-restricted-syntax');
    expect(await rules(f, 'declare const L: any; L.divIcon({ html: "<b>x</b>" });')).toContain(
      'no-restricted-syntax',
    );
  });
  it('allows divIcon html only as a literal or a layers.ts node in icons.ts', async () => {
    const f = 'src/map/icons.ts';
    expect(await rules(f, 'declare const L: any, n: string; L.divIcon({ html: n });')).toContain(
      'no-restricted-syntax',
    );
    expect(
      await rules(f, 'declare const L: any, n: string; L.divIcon({ html: `<b>${n}</b>` });'),
    ).toContain('no-restricted-syntax');
    expect(
      await rules(
        f,
        'declare const L: any, n: string, textNode: any; L.divIcon({ html: textNode("b", n) });',
      ),
    ).not.toContain('no-restricted-syntax');
  });
  it('keeps screens away from the outside world', async () => {
    expect(
      await rules('src/features/x.tsx', 'export const v = localStorage.getItem("a");'),
    ).toContain('no-restricted-globals');
    expect(await rules('src/ui/x.tsx', 'export const v = navigator.onLine;')).toContain(
      'no-restricted-globals',
    );
    expect(await rules('src/features/x.tsx', 'import L from "leaflet"; export { L };')).toContain(
      'no-restricted-imports',
    );
    expect(
      await rules(
        'src/features/x.tsx',
        'import { store } from "../../platform/storage"; export { store };',
      ),
    ).toContain('no-restricted-imports');
  });
});
