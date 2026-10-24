import { AuthClient, type Factor } from '@supabase/auth-js';
import { SUPABASE_KEY, SUPABASE_URL } from '../api/config';

/* The admin console talks to Supabase Auth (password, then a TOTP factor the
   admin picks) and to the admin_* database functions. The session lives in
   sessionStorage: closing the window ends it (RFC-0003 §12.2); the database
   ends it anyway after admin_session_hours. */
const storage = (() => {
  try {
    return window.sessionStorage;
  } catch {
    return undefined; /* blocked storage: the session lives in memory */
  }
})();

export const auth = new AuthClient({
  url: `${SUPABASE_URL}/auth/v1`,
  headers: { apikey: SUPABASE_KEY },
  storageKey: 'yui.admin.auth',
  storage,
  persistSession: true,
  autoRefreshToken: true,
  detectSessionInUrl: false,
});

export type Outcome = 'ok' | 'bad' | 'captcha' | 'net';

export async function signIn(email: string, password: string, captchaToken?: string) {
  try {
    const { error } = await auth.signInWithPassword({
      email,
      password,
      options: captchaToken ? { captchaToken } : {},
    });
    if (!error) return 'ok';
    if (error.code === 'captcha_failed' || /captcha/i.test(error.message)) return 'captcha';
    return error.status && error.status < 500 ? 'bad' : 'net';
  } catch {
    return 'net';
  }
}

export async function signOut() {
  await auth.signOut({ scope: 'local' }).catch(() => {});
}

/** Verified TOTP factors (to choose from) and whether any are half-enrolled. */
export async function factors(): Promise<{ verified: Factor[]; pending: Factor[] } | null> {
  const { data, error } = await auth.mfa.listFactors();
  if (error) return null;
  const totp = data.all.filter((f) => f.factor_type === 'totp');
  return {
    verified: totp.filter((f) => f.status === 'verified'),
    pending: totp.filter((f) => f.status !== 'verified'),
  };
}

export async function verifyCode(factorId: string, code: string): Promise<Outcome> {
  try {
    const { error } = await auth.mfa.challengeAndVerify({ factorId, code });
    if (!error) return 'ok';
    return error.status && error.status < 500 ? 'bad' : 'net';
  } catch {
    return 'net';
  }
}

export interface Enrolment {
  id: string;
  qr: string;
  secret: string;
}
/** Starts a TOTP factor; leftovers of an earlier, unfinished attempt go first. */
export async function enroll(friendlyName: string): Promise<Enrolment | null> {
  const f = await factors();
  for (const p of f?.pending ?? []) await auth.mfa.unenroll({ factorId: p.id }).catch(() => {});
  const { data, error } = await auth.mfa.enroll({ factorType: 'totp', friendlyName });
  if (error || data.type !== 'totp') return null;
  return { id: data.id, qr: data.totp.qr_code, secret: data.totp.secret };
}

export async function unenroll(factorId: string): Promise<boolean> {
  const { error } = await auth.mfa.unenroll({ factorId });
  return !error;
}

/* ---------- the admin_* functions ---------- */

export class Forbidden extends Error {}

async function token(): Promise<string> {
  const { data } = await auth.getSession();
  if (!data.session) throw new Forbidden();
  return data.session.access_token;
}

/** Calls a database function. A refusal (401/403) means not an admin, or the
    session ended: the console goes back to sign-in. */
export async function rpc<T>(fn: string, args: Record<string, unknown> = {}): Promise<T> {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_KEY,
      authorization: `Bearer ${await token()}`,
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify(args),
  });
  if (r.status === 401 || r.status === 403) throw new Forbidden();
  if (!r.ok) throw new Error(`rpc ${fn}: ${r.status}`);
  return (await r.json()) as T;
}

export interface Whoami {
  status: 'ok' | 'forbidden';
  email?: string;
  session_expires_at?: string;
}
export const whoami = () => rpc<Whoami>('admin_whoami');
