/* The admin console, rendered in Node like the app's screens: every phase
   and tab × en/ja/ko, failing on errors and on undefined, NaN or
   [object Object] in the output (missing strings show up that way). */
import { prerender } from 'react-dom/static';
import { describe, expect, it } from 'vitest';
import { AdminApp } from '../../src/admin/AdminApp';
import { admin, type Phase, type Tab } from '../../src/admin/state';

async function html(): Promise<string> {
  const errors: unknown[] = [];
  const { prelude } = await prerender(<AdminApp />, { onError: (e) => void errors.push(e) });
  const out = await new Response(prelude).text();
  if (errors.length) throw errors[0];
  return out;
}

const cases: [string, Phase, Partial<ReturnType<typeof admin.get>>, RegExp][] = [
  ['login', 'login', {}, /name="password"/],
  ['login-refused', 'login', { forbidden: true }, /role="alert"/],
  ['pick', 'pick', {}, /class="panel"/],
  ['enroll', 'enroll', {}, /class="step"/],
  ...(['queue', 'accounts', 'search', 'log', 'security'] as Tab[]).map(
    (tab): [string, Phase, Partial<ReturnType<typeof admin.get>>, RegExp] => [
      `ready-${tab}`,
      'ready',
      { tab, email: 'owner@example.com', until: '2026-10-13T12:00:00Z', factorCount: 2 },
      /data-tab="queue"/,
    ],
  ),
  ['ready-one-factor', 'ready', { factorCount: 1 }, /class="warn"/],
  ['ready-item', 'ready', { item: { kind: 'place', id: 1 } }, /data-tab/],
];

describe.each(['en', 'ja', 'ko'] as const)('%s', (lang) => {
  it.each(cases)('%s', async (_n, phase, extra, mark) => {
    admin.set({
      lang,
      phase,
      forbidden: false,
      item: null,
      tab: 'queue',
      factorCount: 2,
      ...extra,
    });
    const out = await html();
    expect(out).toMatch(mark);
    const bad = out.match(/.{0,60}(undefined|NaN|\[object Object\]).{0,30}/);
    expect(bad?.[0] ?? '').toBe('');
  });
});
