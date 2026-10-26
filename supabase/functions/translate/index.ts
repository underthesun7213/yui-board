/* Supabase Edge Function `translate` (Deno). Woken with a shared secret; calls
   the two service_role database functions with its own secret key and Azure
   with the translator key. All four values are function secrets, never in the
   repository. Answers with counts only. Logic and tests: worker.ts. */
import { azure, runOnce, sameSecret, type Rpc } from './worker.ts';

const env = (k: string) => Deno.env.get(k) ?? '';

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response(null, { status: 405 });
  /* only the database's scheduled kick may run it; a wrong secret touches nothing */
  if (!sameSecret(req.headers.get('x-yunabi-kick'), env('TRANSLATE_KICK_SECRET')))
    return new Response(null, { status: 401 });

  const base = env('SUPABASE_URL');
  const key = env('TRANSLATE_SERVICE_KEY');
  const call = async (fn: string, args: Record<string, unknown>) => {
    const r = await fetch(`${base}/rest/v1/rpc/${fn}`, {
      method: 'POST',
      headers: { apikey: key, authorization: `Bearer ${key}`, 'content-type': 'application/json' },
      body: JSON.stringify(args),
    });
    if (!r.ok) throw new Error(`${fn}: ${r.status}`);
    return r.json();
  };
  const rpc: Rpc = {
    claim: (n) => call('translation_claim', { p_max_jobs: n }),
    apply: (provider, results) =>
      call('translation_apply', { p_provider: provider, p_results: results }),
  };
  try {
    const done = await runOnce(
      rpc,
      azure(env('AZURE_TRANSLATOR_KEY'), env('AZURE_TRANSLATOR_REGION')),
      25,
    );
    return Response.json(done);
  } catch {
    /* no details: they could carry the provider's message */
    return Response.json({ status: 'error' }, { status: 500 });
  }
});
