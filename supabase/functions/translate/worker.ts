/* The translate Edge Function's logic (ADR-0026, D32), without Deno or
   network specifics so Vitest can run it: take queued work through
   translation_claim, translate each description with a machine-translation
   API (never an LLM: user text could carry instructions), hand the results
   back through translation_apply. index.ts wires it to the real services. */

export type Lang = 'en' | 'ja' | 'ko';
export type FailureCode = 'quota' | 'rate' | 'provider' | 'timeout' | 'too_long';

export interface Job {
  claim: string;
  place_id: number;
  text: string;
  src: Lang;
  targets: Lang[];
  hash: string;
}

export interface Claimed {
  status: string;
  jobs?: Job[];
}

/** The two database functions, as the function's service key may call them. */
export interface Rpc {
  claim(maxJobs: number): Promise<Claimed>;
  apply(provider: string, results: unknown[]): Promise<unknown>;
}

export class TranslateFailure extends Error {
  constructor(readonly code: FailureCode) {
    super(code);
  }
}

export interface Translator {
  name: 'azure' | 'google' | 'deepl';
  translate(text: string, from: Lang, to: Lang[]): Promise<Partial<Record<Lang, string>>>;
}

/** One run: claim, translate, apply. Returns counts only. After a quota or
    rate refusal the rest of the batch is handed back with the same error, so
    the database pauses translation instead of each job burning attempts. */
export async function runOnce(rpc: Rpc, tr: Translator, maxJobs = 20) {
  const claimed = await rpc.claim(maxJobs);
  const jobs = claimed.status === 'ok' ? (claimed.jobs ?? []) : [];
  if (!jobs.length) return { status: claimed.status, jobs: 0, failed: 0 };
  const results: unknown[] = [];
  let stop: FailureCode | null = null;
  let failed = 0;
  for (const j of jobs) {
    const base = { claim: j.claim, place_id: j.place_id, hash: j.hash };
    if (stop) {
      results.push({ ...base, error: stop });
      failed++;
      continue;
    }
    try {
      const out = await tr.translate(j.text, j.src, j.targets);
      results.push({
        ...base,
        out: j.targets.flatMap((lang) => (out[lang] ? [{ lang, text: out[lang] }] : [])),
      });
    } catch (e) {
      const code = e instanceof TranslateFailure ? e.code : 'provider';
      if (code === 'quota' || code === 'rate') stop = code;
      results.push({ ...base, error: code });
      failed++;
    }
  }
  await rpc.apply(tr.name, results);
  return { status: 'ok', jobs: jobs.length, failed };
}

/** Compares the wake-up secret in constant time, so the response time does
    not tell an attacker how much of a guess was right. */
export function sameSecret(given: string | null, expected: string): boolean {
  if (!expected || given === null || given.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= given.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

const AZURE = 'https://api.cognitive.microsofttranslator.com/translate';

/** Azure AI Translator v3 (the recommended provider, TR-Q1). Plain text, one
    request per description, all target languages at once. 429 is a rate
    limit, 403 a spent quota on the free tier; anything else is the provider. */
export function azure(
  key: string,
  region: string,
  fetchFn: typeof fetch = fetch,
  timeoutMs = 10000,
): Translator {
  return {
    name: 'azure',
    async translate(text, from, to) {
      const q = new URLSearchParams({ 'api-version': '3.0', from, textType: 'plain' });
      for (const t of to) q.append('to', t);
      const ctl = new AbortController();
      const timer = setTimeout(() => ctl.abort(), timeoutMs);
      let r: Response;
      try {
        r = await fetchFn(`${AZURE}?${q}`, {
          method: 'POST',
          headers: {
            'Ocp-Apim-Subscription-Key': key,
            'Ocp-Apim-Subscription-Region': region,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify([{ Text: text }]),
          signal: ctl.signal,
        });
      } catch {
        throw new TranslateFailure('timeout');
      } finally {
        clearTimeout(timer);
      }
      if (r.status === 429) throw new TranslateFailure('rate');
      if (r.status === 403) throw new TranslateFailure('quota');
      if (!r.ok) throw new TranslateFailure('provider');
      const body = (await r.json()) as { translations?: { text?: unknown; to?: unknown }[] }[];
      const out: Partial<Record<Lang, string>> = {};
      for (const t of body?.[0]?.translations ?? []) {
        if (typeof t.text === 'string' && to.includes(t.to as Lang)) out[t.to as Lang] = t.text;
      }
      return out;
    },
  };
}
