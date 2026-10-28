/* D32: the translate Edge Function's logic with a fake database and a fake
   translator, the Azure adapter with a fake fetch, and how the app attaches
   translations to places. */
import { describe, expect, it } from 'vitest';
import {
  azure,
  runOnce,
  sameSecret,
  TranslateFailure,
  type Job,
  type Lang,
  type Rpc,
  type Translator,
} from '../../supabase/functions/translate/worker';
import { withEventTranslations, withTranslations } from '../../src/api/rest';
import { inLang, makeSchedule, occOn } from '../../src/domain/calendar/occurrences';
import type { EventSeries, OccurrenceOverride, Place } from '../../src/domain/types';

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
  translate: async (texts, _from, to) =>
    texts.map((text) => Object.fromEntries(to.map((l) => [l, `${l}:${text}`]))),
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
    const partial: Translator = { name: 'azure', translate: async () => [{ en: 'only English' }] };
    const { rpc, applied } = fakeRpc('ok', [job(1, 'ja')]);
    await runOnce(rpc, partial);
    expect((applied[0]!.results[0] as { out: unknown }).out).toEqual([
      { lang: 'en', text: 'only English' },
    ]);
  });

  it('sends an event’s non-empty texts in one request and returns them by name (TR-Q2)', async () => {
    const sent: string[][] = [];
    const tr: Translator = {
      name: 'azure',
      translate: async (texts, from, to) => {
        sent.push(texts);
        return echo.translate(texts, from, to);
      },
    };
    const ev: Job = {
      claim: 'e1',
      event_id: 7,
      texts: { title: '花火', body: '雨天中止' },
      src: 'ja',
      targets: ['en', 'ko'],
      hash: 'he',
    };
    const { rpc, applied } = fakeRpc('ok', [ev]);
    await runOnce(rpc, tr);
    expect(sent).toEqual([['花火', '雨天中止']]);
    expect(applied[0]!.results).toEqual([
      {
        claim: 'e1',
        event_id: 7,
        hash: 'he',
        out: [
          { lang: 'en', title: 'en:花火', body: 'en:雨天中止' },
          { lang: 'ko', title: 'ko:花火', body: 'ko:雨天中止' },
        ],
      },
    ]);
  });

  it('leaves out an event language that came back without every field', async () => {
    const tr: Translator = {
      name: 'azure',
      translate: async () => [{ en: 'Fireworks', ko: '불꽃놀이' }, { en: 'Cancelled if rain' }],
    };
    const ev: Job = {
      claim: 'e2',
      event_id: 8,
      texts: { title: '花火', place_text: '中庭' },
      src: 'ja',
      targets: ['en', 'ko'],
      hash: 'h',
    };
    const { rpc, applied } = fakeRpc('ok', [ev]);
    await runOnce(rpc, tr);
    expect((applied[0]!.results[0] as { out: unknown }).out).toEqual([
      { lang: 'en', title: 'Fireworks', place_text: 'Cancelled if rain' },
    ]);
  });
});

describe('wake-up secret', () => {
  it('accepts only the exact secret, and never an empty one', () => {
    expect(sameSecret('s3cret', 's3cret')).toBe(true);
    expect(sameSecret('s3creT', 's3cret')).toBe(false);
    expect(sameSecret('s3cre', 's3cret')).toBe(false);
    expect(sameSecret(null, 's3cret')).toBe(false);
    expect(sameSecret('', '')).toBe(false);
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
          { translations: [{ text: 'Near', to: 'en' }] },
        ]),
      );
    }) as unknown as typeof fetch;
    const out = await azure('k', 'japaneast', fetchFn).translate(['駅', '近い'], 'ja', [
      'en',
      'ko',
    ]);
    expect(out).toEqual([{ en: 'Station', ko: '역' }, { en: 'Near' }]);
    expect(url).toContain('api-version=3.0');
    expect(url).toContain('from=ja');
    expect(url).toContain('textType=plain');
    expect(url).toContain('to=en&to=ko');
    const h = init!.headers as Record<string, string>;
    expect(h['Ocp-Apim-Subscription-Key']).toBe('k');
    expect(h['Ocp-Apim-Subscription-Region']).toBe('japaneast');
    expect(JSON.parse(String(init!.body))).toEqual([{ Text: '駅' }, { Text: '近い' }]);
  });

  it('turns HTTP failures into codes', async () => {
    const code = async (f: typeof fetch) => {
      try {
        await azure('k', 'r', f).translate(['x'], 'en', ['ja']);
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

describe('translations reach the events (TR-Q2)', () => {
  const series: EventSeries = {
    id: 4,
    title: 'Tuesday event',
    start_date: '2026-09-15',
    start_time: '18:00',
    end_time: '20:00',
    weekly_until: '2026-09-29',
    place_text: 'Cafe',
    body: 'Weekly.',
    lang: 'en',
    created_on: '2026-09-01',
    edited_on: null,
  };
  const [e] = withEventTranslations(
    [series],
    [{ event_id: 4, lang: 'ja', title: '火曜イベント', place_text: 'カフェ', body: '毎週。' }],
  );
  const week: OccurrenceOverride = {
    event_id: 4,
    occurs_on: '2026-09-22',
    cancelled: false,
    title: 'Karaoke',
    start_time: null,
    end_time: null,
    place_text: null,
    body: 'This week: karaoke.',
  };
  const s = makeSchedule([e!], [week]);

  it('shows every field translated on a week left as it was', () => {
    const t = inLang(occOn(s, '2026-09-15')[0]!, 'ja');
    expect(t.title).toEqual({ text: '火曜イベント', lang: 'ja' });
    expect(t.place).toEqual({ text: 'カフェ', lang: 'ja' });
    expect(t.body).toEqual({ text: '毎週。', lang: 'ja' });
    expect(t.translated).toBe(true);
  });

  it('keeps the fields a week rewrote as written', () => {
    const t = inLang(occOn(s, '2026-09-22')[0]!, 'ja');
    expect(t.title).toEqual({ text: 'Karaoke', lang: 'en' });
    expect(t.body).toEqual({ text: 'This week: karaoke.', lang: 'en' });
    expect(t.place).toEqual({ text: 'カフェ', lang: 'ja' });
  });

  it('shows the original in its own language and where no translation exists', () => {
    const o = occOn(s, '2026-09-15')[0]!;
    expect(inLang(o, 'en').translated).toBe(false);
    expect(inLang(o, 'ko')).toMatchObject({
      title: { text: 'Tuesday event', lang: 'en' },
      translated: false,
    });
  });
});
