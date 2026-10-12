import { AuthError, currentToken, ensureToken } from './auth';
import { SUPABASE_KEY, SUPABASE_URL } from './config';

/* Writes go through the database functions only (ADR-0021). Every answer is
   a status the screens can explain; the network and the server's own refusals
   become statuses too. */
export type WriteStatus =
  | 'ok'
  | 'duplicate'
  | 'invalid'
  | 'not_found'
  | 'past_event'
  | 'rate_limited'
  | 'suspended'
  | 'forbidden'
  | 'offline'
  | 'error';
export interface WriteResult {
  status: WriteStatus;
  id?: number;
  pref?: string;
  field?: string;
}

async function call(
  fn: string,
  body: unknown,
  token: string,
  method: 'POST' | 'GET' = 'POST',
): Promise<Response> {
  return fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method,
    headers: {
      apikey: SUPABASE_KEY,
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: method === 'POST' ? JSON.stringify(body) : undefined,
  });
}

export async function write(fn: string, args: Record<string, unknown>): Promise<WriteResult> {
  let token: string;
  try {
    token = await ensureToken();
  } catch (e) {
    if (e instanceof AuthError && e.message === 'rate_limited') return { status: 'rate_limited' };
    return { status: navigator.onLine === false ? 'offline' : 'error' };
  }
  try {
    const r = await call(fn, args, token);
    if (r.status === 429) return { status: 'rate_limited' };
    if (r.status === 401 || r.status === 403) return { status: 'forbidden' };
    if (!r.ok) return { status: 'error' };
    return (await r.json()) as WriteResult;
  } catch {
    return { status: navigator.onLine === false ? 'offline' : 'error' };
  }
}

export interface MyItem {
  kind: 'place' | 'event';
  id: number;
  title: string;
  state: 'visible' | 'hidden_review' | 'deleted';
  created_on: string;
  edited_on: string | null;
  deleted_on: string | null;
  last_date: string | null;
}

/** The items this browser's account registered (GET; no account is created). */
export async function myItems(): Promise<MyItem[] | null> {
  const token = await currentToken().catch(() => null);
  if (!token) return [];
  try {
    const r = await call('my_items', null, token, 'GET');
    return r.ok ? ((await r.json()) as MyItem[]) : null;
  } catch {
    return null;
  }
}
