import { hasStoredSession } from '../api/auth';
import { FIXTURE_MODE } from '../api/config';
import { myItems, write, type WriteResult } from '../api/rpc';
import { navigate } from '../app/router';
import type { EventInput, PlaceInput } from '../domain/validation';
import { t } from '../i18n';
import { confirmAction, newId } from '../platform/dialog';
import { isFramed } from '../platform/frame';
import { store } from '../platform/storage';
import { mapUi } from '../state/mapUi';
import { prefs } from '../state/prefs';
import { session } from '../state/session';
import { loadData } from './data';
import { toast } from './ui';

const m = () => t(prefs.get().lang);

/* ---------- session ---------- */

/** What this browser posted, when it has an account. Never creates one. */
export async function refreshMine() {
  if (FIXTURE_MODE || !hasStoredSession()) {
    session.set({ hasAccount: false, items: [], framed: isFramed() });
    return;
  }
  const items = await myItems();
  if (!items) return;
  const minePlaces: Record<number, true> = {};
  const mineEvents: Record<number, true> = {};
  for (const i of items) (i.kind === 'place' ? minePlaces : mineEvents)[i.id] = true;
  session.set({ hasAccount: true, items, minePlaces, mineEvents, framed: isFramed() });
}

/* ---------- drafts (Y-C4) ---------- */
/* A form keeps what was typed in device storage until it is sent, with the
   token that makes a resend count once. */

export interface Draft<T> {
  token: string;
  fields: T;
}
export function openDraft<T>(key: 'place' | 'event', fresh: T): Draft<T> {
  const d = store.get<Draft<T> | null>(`draft.${key}`, null);
  return d && typeof d.token === 'string' && d.fields ? d : { token: newId(), fields: fresh };
}
export const saveDraft = <T>(key: 'place' | 'event', d: Draft<T>) => store.set(`draft.${key}`, d);
export const dropDraft = (key: 'place' | 'event') => store.set(`draft.${key}`, null);

/* ---------- results ---------- */

/** A message for a refused write, or null when it went through. */
export function explain(r: WriteResult): string | null {
  const msg = m();
  switch (r.status) {
    case 'ok':
    case 'duplicate':
      return null;
    case 'invalid':
      return msg.inv[(r.field ?? 'other') as keyof typeof msg.inv] ?? msg.inv.other;
    case 'rate_limited':
      return msg.eRate;
    case 'suspended':
      return msg.eSusp;
    case 'not_found':
      return msg.eNotFound;
    case 'past_event':
      return msg.ePast;
    case 'forbidden':
      return msg.eForbidden;
    default:
      return msg.eNet;
  }
}

async function after(r: WriteResult, message: string) {
  if (r.status !== 'ok' && r.status !== 'duplicate') return;
  toast(message);
  await Promise.all([loadData(), refreshMine()]);
}

/* ---------- places ---------- */

const placeArgs = (p: PlaceInput) => ({
  p_name: p.name.trim(),
  p_category: p.category,
  p_description: p.description,
  p_gmaps_url: p.gmaps_url.trim() || null,
  p_lat: p.lat,
  p_lng: p.lng,
  p_lang: p.lang,
});

export async function savePlace(
  p: PlaceInput,
  opts: { id?: number; token: string },
): Promise<WriteResult> {
  const r = opts.id
    ? await write('update_place', { p_id: opts.id, ...placeArgs(p) })
    : await write('create_place', { p_client_token: opts.token, ...placeArgs(p) });
  await after(r, m().saved);
  if (r.status === 'ok' || r.status === 'duplicate') {
    if (!opts.id) dropDraft('place');
    const id = opts.id ?? r.id;
    navigate({ name: 'map' }, { replace: true });
    /* show it: its prefecture under All of Japan, card open */
    mapUi.set((s) => ({
      mode: 'japan',
      pref: r.pref ?? s.pref,
      pl: id ?? null,
      cat: '',
      fitSeq: s.fitSeq + 1,
    }));
  }
  return r;
}

export async function deletePlace(id: number): Promise<void> {
  if (!confirmAction(m().confirmDelete)) return;
  const r = await write('delete_place', { p_id: id });
  const why = explain(r);
  if (why) return toast(why);
  mapUi.set((s) => ({ pl: s.pl === id ? null : s.pl }));
  await after(r, m().deleted);
}

/* ---------- events ---------- */

const eventArgs = (e: EventInput) => ({
  p_title: e.title.trim(),
  p_start_date: e.start_date,
  p_start_time: e.start_time,
  p_end_time: e.end_time,
  p_weekly_until: e.weekly_until,
  p_place_text: e.place_text.trim(),
  p_body: e.body,
  p_lang: e.lang,
});

export async function saveEvent(
  e: EventInput,
  opts: { id?: number; token: string },
): Promise<WriteResult> {
  const r = opts.id
    ? await write('update_event', { p_id: opts.id, ...eventArgs(e) })
    : await write('create_event', { p_client_token: opts.token, ...eventArgs(e) });
  await after(r, m().saved);
  if (r.status === 'ok' || r.status === 'duplicate') {
    if (!opts.id) dropDraft('event');
    const id = opts.id ?? r.id;
    if (id) navigate({ name: 'event', id, date: e.start_date }, { replace: true });
  }
  return r;
}

export async function deleteEvent(id: number, opts: { stay?: boolean } = {}): Promise<void> {
  if (!confirmAction(m().confirmDelete)) return;
  const r = await write('delete_event', { p_id: id });
  const why = explain(r);
  if (why) return toast(why);
  await after(r, m().deleted);
  if (!opts.stay) navigate({ name: 'cal' }, { replace: true });
}

export interface WeekInput {
  cancelled: boolean;
  title: string;
  start_time: string;
  end_time: string;
  place_text: string;
  body: string;
}
export async function saveWeek(id: number, date: string, w: WeekInput): Promise<WriteResult> {
  const r = await write('set_occurrence', {
    p_event_id: id,
    p_occurs_on: date,
    p_cancelled: w.cancelled,
    p_title: w.cancelled ? null : w.title.trim() || null,
    p_start_time: w.cancelled ? null : w.start_time || null,
    p_end_time: w.cancelled ? null : w.end_time || null,
    p_place_text: w.cancelled ? null : w.place_text.trim() || null,
    p_body: w.cancelled ? null : w.body || null,
  });
  await after(r, m().saved);
  if (r.status === 'ok') navigate({ name: 'event', id, date }, { replace: true });
  return r;
}

export async function resetWeek(id: number, date: string): Promise<WriteResult> {
  const r = await write('clear_occurrence', { p_event_id: id, p_occurs_on: date });
  await after(r, m().saved);
  if (r.status === 'ok') navigate({ name: 'event', id, date }, { replace: true });
  return r;
}

/* ---------- the place form's map ---------- */

export const startPick = (at: { lat: number; lng: number } | null) =>
  mapUi.set({ picking: true, pick: at, pl: null });
export const stopPick = () => mapUi.set({ picking: false, pick: null });
export const setPick = (at: { lat: number; lng: number }) => mapUi.set({ pick: at });

/* "Use my current location" in the place form — only after the person has
   read and accepted that the spot becomes public (Y-M7). */
export async function pickHere(): Promise<boolean> {
  const { getPosition } = await import('../platform/geolocation');
  const r = await getPosition();
  if (!r.ok) {
    toast(r.denied ? m().locDenied : m().locFail);
    return false;
  }
  setPick(r.loc);
  return true;
}
