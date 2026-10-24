import type { GoTrueClient } from '@supabase/auth-js';
import { store } from '../platform/storage';
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

export class AuthError extends Error {}

/* Remembers that this browser had an account. If its session disappears (a
   refresh the server refused, cleared storage), a new anonymous account
   would silently cut the person off from what they posted — so that only
   happens after they have been told once. */
const HAD = 'had_account';
export const hadAccount = () => store.get<boolean>(HAD, false);
export const acceptNewAccount = () => store.set(HAD, false);

/** The current access token, or null when this browser has no session. */
export async function currentToken(): Promise<string | null> {
  const a = await auth();
  const { data } = await a.getSession();
  return data.session?.access_token ?? null;
}

/** A fresh token after the server refused the old one. */
export async function refreshToken(): Promise<string | null> {
  const a = await auth();
  const { data } = await a.refreshSession();
  return data.session?.access_token ?? null;
}

/** A token, creating the anonymous account if this is the first write. */
export async function ensureToken(captchaToken?: string): Promise<string> {
  const have = await currentToken();
  if (have) return have;
  if (hadAccount()) throw new AuthError('session_lost');
  const a = await auth();
  const { data, error } = await a.signInAnonymously({
    options: captchaToken ? { captchaToken } : {},
  });
  if (error || !data.session) {
    if (error?.code === 'captcha_failed' || /captcha/i.test(error?.message ?? ''))
      throw new AuthError('captcha');
    throw new AuthError(error?.status === 429 ? 'rate_limited' : 'auth_failed');
  }
  store.set(HAD, true);
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
