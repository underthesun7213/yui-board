import { createStore } from '../state/store';
import { auth, factors, Forbidden, signOut, whoami } from './api';
import type { AdminLang } from './i18n';

export type Phase = 'boot' | 'login' | 'pick' | 'enroll' | 'ready';
export type Tab = 'queue' | 'accounts' | 'search' | 'log' | 'security';
export interface ItemRef {
  kind: 'place' | 'event';
  id: number;
}

const startLang = (): AdminLang => {
  const l = (globalThis.navigator?.language ?? 'en').slice(0, 2);
  return l === 'ja' || l === 'ko' ? l : 'en';
};

export const admin = createStore<{
  lang: AdminLang;
  phase: Phase;
  email: string;
  until: string | null;
  /** verified authenticators; fewer than two is a warning (RFC-0003 §12.2) */
  factorCount: number;
  /** why the console went back to sign-in */
  forbidden: boolean;
  tab: Tab;
  item: ItemRef | null;
}>({
  lang: startLang(),
  phase: 'boot',
  email: '',
  until: null,
  factorCount: 0,
  forbidden: false,
  tab: 'queue',
  item: null,
});

/** Works out where the admin is: signed out, half-way (password only), or in. */
export async function resume() {
  const { data } = await auth.getSession();
  if (!data.session) return admin.set({ phase: 'login' });
  const f = await factors();
  if (!f) return admin.set({ phase: 'login' });
  const { data: aal } = await auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel !== 'aal2')
    return admin.set({
      phase: f.verified.length ? 'pick' : 'enroll',
      factorCount: f.verified.length,
    });
  try {
    const w = await whoami();
    if (w.status !== 'ok') return refused();
    admin.set({
      phase: 'ready',
      email: w.email ?? '',
      until: w.session_expires_at ?? null,
      factorCount: f.verified.length,
      forbidden: false,
    });
  } catch {
    return refused();
  }
}

/** Not an admin, or the session ended: back to sign-in, saying so. */
export async function refused() {
  await signOut();
  admin.set({ phase: 'login', forbidden: true, item: null, email: '', until: null });
}

export async function leave() {
  await signOut();
  admin.set({ phase: 'login', forbidden: false, item: null, email: '', until: null });
}

/** Runs an admin call; a refusal ends the session in the console too. */
export async function guarded<T>(run: () => Promise<T>): Promise<T | null> {
  try {
    return await run();
  } catch (e) {
    if (e instanceof Forbidden) await refused();
    return null;
  }
}
