/* D32: the translate Edge Function's logic with a fake database and a fake
   translator, the Azure adapter with a fake fetch, and how the app attaches
   translations to places. */
import { describe, expect, it } from 'vitest';
import {
  azure,
  runOnce,
  TranslateFailure,
  type Job,
  type Lang,
  type Rpc,
  type Translator,
} from '../../supabase/functions/translate/worker';
import { withTranslations } from '../../src/api/rest';
import type { Place } from '../../src/domain/types';

const job = (id: number, src: Lang, text = `text ${id}`): Job => ({
  claim: `c${id}`,
  place_id: id,
  text,
  src,
  targets: (['en', 'ja', 'ko'] as Lang[]).filter((l) => l !== src),
  hash: `h${id}`,
});

function fakeRpc(status: string, jobs: Job[]) {
  const applied: { provider: string; results: unknown[] }[] = [];
  const rpc: Rpc = {
    claim: async () => ({ status, jobs }),
    apply: async (provider, results) => {
      applied.push({ provider, results });
      return { status: 'ok' };
    },
  };
  return { rpc, applied };
}

const echo: Translator = {
  name: 'azure',
  translate: async (text, _from, to) => Object.fromEntries(to.map((l) => [l, `${l}:${text}`])),
};

describe('translate worker', () => {
  it('translates every claimed job into its target languages and applies once', async () => {
    const { rpc, applied } = fakeRpc('ok', [job(1, 'ja'), job(2, 'ko')]);
    expect(await runOnce(rpc, echo)).toEqual({ status: 'ok', jobs: 2, failed: 0 });
    expect(applied).toHaveLength(1);
    expect(applied[0]!.provider).toBe('azure');
    expect(applied[0]!.results).toEqual([
      {
        claim: 'c1',
        place_id: 1,
        hash: 'h1',
        out: [
          { lang: 'en', text: 'en:text 1' },
          { lang: 'ko', text: 'ko:text 1' },
        ],
      },
      {
        claim: 'c2',
        place_id: 2,
        hash: 'h2',
        out: [
          { lang: 'en', text: 'en:text 2' },
          { lang: 'ja', text: 'ja:text 2' },
        ],
      },
    ]);
  });

  it('does nothing when there is no work or translation is off', async () => {
    for (const status of ['ok', 'disabled', 'paused', 'budget']) {
      const { rpc, applied } = fakeRpc(status, []);
      expect((await runOnce(rpc, echo)).jobs).toBe(0);
      expect(applied).toHaveLength(0);
    }
  });

  it('reports a failed job by code, and stops calling the provider after a quota or rate refusal', async () => {
    let calls = 0;
    const flaky: Translator = {
      name: 'azure',
      translate: async () => {
        calls++;
        if (calls === 1) throw new Error('socket hang up');
        throw new TranslateFailure('quota');
      },
    };
    const { rpc, applied } = fakeRpc('ok', [job(1, 'en'), job(2, 'en'), job(3, 'en')]);
    expect(await runOnce(rpc, flaky)).toEqual({ status: 'ok', jobs: 3, failed: 3 });
    expect(calls).toBe(2);
    expect(applied[0]!.results.map((r) => (r as { error: string }).error)).toEqual([
      'provider',
      'quota',
      'quota',
    ]);
  });

  it('leaves out a language the provider did not return', async () => {
    const partial: Translator = { name: 'azure', translate: async () => ({ en: 'only English' }) };
    const { rpc, applied } = fakeRpc('ok', [job(1, 'ja')]);
    await runOnce(rpc, partial);
    expect((applied[0]!.results[0] as { out: unknown }).out).toEqual([
      { lang: 'en', text: 'only English' },
    ]);
  });
});

describe('Azure adapter', () => {
  const reply = (status: number, body: unknown = []) =>
    (async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch;

  it('sends plain text with the key and region, and reads each target language', async () => {
    let url = '';
    let init: RequestInit | undefined;
    const fetchFn = (async (u: string, i: RequestInit) => {
      url = u;
      init = i;
      return new Response(
        JSON.stringify([
          {
            translations: [
              { text: 'Station', to: 'en' },
              { text: '역', to: 'ko' },
              { text: 'unexpected', to: 'fr' },
            ],
          },
        ]),
      );
    }) as unknown as typeof fetch;
    const out = await azure('k', 'japaneast', fetchFn).translate('駅', 'ja', ['en', 'ko']);
    expect(out).toEqual({ en: 'Station', ko: '역' });
    expect(url).toContain('api-version=3.0');
    expect(url).toContain('from=ja');
    expect(url).toContain('textType=plain');
    expect(url).toContain('to=en&to=ko');
    const h = init!.headers as Record<string, string>;
    expect(h['Ocp-Apim-Subscription-Key']).toBe('k');
    expect(h['Ocp-Apim-Subscription-Region']).toBe('japaneast');
    expect(JSON.parse(String(init!.body))).toEqual([{ Text: '駅' }]);
  });

  it('turns HTTP failures into codes', async () => {
    const code = async (f: typeof fetch) => {
      try {
        await azure('k', 'r', f).translate('x', 'en', ['ja']);
        return 'none';
      } catch (e) {
        return (e as TranslateFailure).code;
      }
    };
    expect(await code(reply(429))).toBe('rate');
    expect(await code(reply(403))).toBe('quota');
    expect(await code(reply(500))).toBe('provider');
    expect(await code(reply(401))).toBe('provider');
    expect(
      await code((async () => {
        throw new Error('offline');
      }) as unknown as typeof fetch),
    ).toBe('timeout');
  });
});

describe('translations reach the places', () => {
  const place = (id: number): Place => ({
    id,
    name: `P${id}`,
    category: 'food',
    description: 'd',
    gmaps_url: null,
    lat: 34.8,
    lng: 135.6,
    pref: '27',
    lang: 'ja',
    created_on: '2026-10-01',
    edited_on: null,
  });
  it('attaches each language to its place and leaves the others alone', () => {
    const out = withTranslations(
      [place(1), place(2)],
      [
        { place_id: 1, lang: 'en', description: 'one' },
        { place_id: 1, lang: 'ko', description: '하나' },
        { place_id: 9, lang: 'en', description: 'gone' },
      ],
    );
    expect(out[0]!.tr).toEqual({ en: 'one', ko: '하나' });
    expect(out[1]!.tr).toBeUndefined();
  });
});
