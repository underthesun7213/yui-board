import type { GoTrueClient } from '@supabase/auth-js';
import { SUPABASE_KEY, SUPABASE_URL } from './config';

/* The anonymous account (Y-A1). Supabase's auth library is loaded the first
   time something needs an account — reading never does — and keeps the
   session in this browser under `yui.auth` (Y-A2). */
let client: Promise<GoTrueClient> | null = null;

function auth(): Promise<GoTrueClient> {
  client ??= import('@supabase/auth-js').then(
    ({ AuthClient }) =>
      new AuthClient({
        url: `${SUPABASE_URL}/auth/v1`,
        headers: { apikey: SUPABASE_KEY },
        storageKey: 'yui.auth',
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      }),
  );
  return client;
}

/** The current access token, or null when this browser has no account yet. */
export async function currentToken(): Promise<string | null> {
  const a = await auth();
  const { data } = await a.getSession();
  return data.session?.access_token ?? null;
}

/** A token, creating the anonymous account if this is the first write. */
export async function ensureToken(): Promise<string> {
  const have = await currentToken();
  if (have) return have;
  const a = await auth();
  const { data, error } = await a.signInAnonymously();
  if (error || !data.session)
    throw new AuthError(error?.status === 429 ? 'rate_limited' : 'auth_failed');
  return data.session.access_token;
}

/** Whether this browser already has an account, without loading the library. */
export function hasStoredSession(): boolean {
  try {
    return !!localStorage.getItem('yui.auth');
  } catch {
    return false;
  }
}

export class AuthError extends Error {}
