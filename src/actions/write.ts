import { acceptNewAccount, hasStoredSession } from '../api/auth';
import { FIXTURE_MODE } from '../api/config';
import { myItems, write as rpcWrite, type WriteResult } from '../api/rpc';
import { captchaNeeded, takeCaptchaToken } from './captcha';
import { navigate } from '../app/router';
import { distM, HOME, JAPAN_BOUNDS, NEAR_M } from '../domain/geo/geo';
import type { EventSeries, Place } from '../domain/types';
import { trimText, type EventInput, type PlaceInput } from '../domain/validation';
import { t } from '../i18n';
import { confirmAction, newId } from '../platform/dialog';
import { isFramed } from '../platform/frame';
import { store } from '../platform/storage';
import { data } from '../state/data';
import { location } from '../state/location';
import { mapUi } from '../state/mapUi';
import { prefs } from '../state/prefs';
import { session } from '../state/session';
import { loadData } from './data';
import { toast } from './ui';

const m = () => t(prefs.get().lang);

/* Every write: a pending CAPTCHA token goes with it; a request for one, or a
   lost sign-in, is turned into the next step for the person. */
async function write(fn: string, args: Record<string, unknown>): Promise<WriteResult> {
  const r = await rpcWrite(fn, args, takeCaptchaToken());
  if (r.status === 'captcha') captchaNeeded();
  if (r.status === 'session_lost') acceptNewAccount();
  return r;
}

/* ---------- session ---------- */

/** What this browser posted, when it has an account. Never creates one. */
export async function refreshMine() {
  if (FIXTURE_MODE || !hasStoredSession()) {
    session.set({ hasAccount: false, items: [], framed: isFramed() });
    return;
  }
  const items = await myItems();
  if (!items) {
    session.set((s) => ({ itemsError: true, items: s.items ?? [] }));
    return;
  }
  const minePlaces: Record<number, true> = {};
  const mineEvents: Record<number, true> = {};
  for (const i of items) (i.kind === 'place' ? minePlaces : mineEvents)[i.id] = true;
  session.set({
    hasAccount: true,
    items,
    minePlaces,
    mineEvents,
    framed: isFramed(),
    itemsError: false,
  });
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
    case 'already_reported':
      return msg.eAlready;
    case 'forbidden':
      return msg.eForbidden;
    case 'captcha':
      return msg.eCaptcha;
    case 'session_lost':
      return msg.eSessionLost;
    default:
      return msg.eNet;
  }
}

async function after(r: WriteResult, message: string) {
  if (r.status !== 'ok' && r.status !== 'duplicate') return;
  toast(message);
  await Promise.all([loadData({ fresh: true }), refreshMine()]);
}

/* ---------- places ---------- */

const placeArgs = (p: PlaceInput) => ({
  p_name: trimText(p.name),
  p_category: p.category,
  p_description: p.description,
  p_gmaps_url: trimText(p.gmaps_url) || null,
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
    /* a hidden item is not on the map: back to My posts, where it shows its state */
    if (!id || !data.get().places.some((x) => x.id === id)) {
      navigate({ name: 'me' }, { replace: true });
    } else {
      navigate({ name: 'map' }, { replace: true });
      /* show it, card open: where the person was if "Near me" already
         shows it, otherwise its prefecture under All of Japan */
      const saved = data.get().places.find((x) => x.id === id);
      const l = location.get();
      const from = l.state === 'ok' && l.loc ? l.loc : HOME;
      const stay = mapUi.get().mode === 'near' && !!saved && distM(from, saved) <= NEAR_M;
      mapUi.set((s) =>
        stay
          ? { pl: id, cat: '', fitSeq: s.fitSeq + 1 }
          : { mode: 'japan', pref: r.pref ?? s.pref, pl: id, cat: '', fitSeq: s.fitSeq + 1 },
      );
    }
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
  p_title: trimText(e.title),
  p_start_date: e.start_date,
  p_start_time: e.start_time,
  p_end_time: e.end_time,
  p_weekly_until: e.weekly_until,
  p_place_text: trimText(e.place_text),
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
    if (id && data.get().events.some((x) => x.id === id))
      navigate({ name: 'event', id, date: e.start_date }, { replace: true });
    else navigate({ name: 'me' }, { replace: true });
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
    p_title: w.cancelled ? null : trimText(w.title) || null,
    p_start_time: w.cancelled ? null : w.start_time || null,
    p_end_time: w.cancelled ? null : w.end_time || null,
    p_place_text: w.cancelled ? null : trimText(w.place_text) || null,
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

/* ---------- reports (Y-R1~R3) ---------- */

export type ReportReason = 'wrong' | 'spam' | 'inappropriate' | 'privacy' | 'other';

/** Sends a report. On success the data is fetched again, so an item the
    report hid leaves the map and calendar here at once. */
export async function report(
  kind: 'place' | 'event',
  id: number,
  reason: ReportReason,
): Promise<WriteResult> {
  const r = await write('submit_report', { p_kind: kind, p_id: id, p_reason: reason });
  if (r.status === 'ok') {
    toast(m().reported);
    void loadData({ fresh: true });
    void refreshMine();
  }
  return r;
}

/* ---------- the place form's map ---------- */

export const startPick = (at: { lat: number; lng: number } | null) =>
  mapUi.set({ picking: true, pick: at, pl: null });
export const stopPick = () => mapUi.set({ picking: false, pick: null });
export const setPick = (at: { lat: number; lng: number }) => mapUi.set({ pick: at });
/** the pin put somewhere the map is not looking: the map goes there too */
export const showPick = (at: { lat: number; lng: number } | null) =>
  mapUi.set((s) => ({ pick: at, pickSeq: s.pickSeq + 1 }));

export type FindResult = 'ok' | 'none' | 'outside' | 'fail' | 'limit' | 'notLink';
/* A Google Maps link or a pair of numbers pasted into the place form
   (Y-BL-02): the pin moves there for the person to check. A short link
   (the phone app's Share) is opened by the app's Worker. */
export async function findSpot(text: string): Promise<FindResult> {
  const [{ pairFromLink, pairFromText, SHORT_LINK }, { safeMapsUrl }] = await Promise.all([
    import('../domain/maps-coords'),
    import('../domain/links'),
  ]);
  const s = text.trim();
  let at = pairFromText(s);
  if (!at && safeMapsUrl(s)) {
    if (SHORT_LINK.test(s)) {
      const { expandShortLink } = await import('../api/mapsLink');
      const r = await expandShortLink(s);
      if (r.status !== 'ok') return r.status === 'invalid' ? 'notLink' : r.status;
      at = { lat: r.lat, lng: r.lng };
    } else {
      at = pairFromLink(s);
      if (!at) return 'none';
    }
  }
  if (!at) return 'notLink';
  if (!inJapan(at)) return 'outside';
  showPick(at);
  return 'ok';
}
const [[S, W], [N, E]] = JAPAN_BOUNDS;
const inJapan = (p: { lat: number; lng: number }) =>
  p.lat >= S && p.lat <= N && p.lng >= W && p.lng <= E;

/* "Use my current location" in the place form — only after the person has
   read and accepted that the spot becomes public (Y-M7). */
export async function pickHere(): Promise<boolean> {
  const { getPosition } = await import('../platform/geolocation');
  const r = await getPosition();
  if (!r.ok) {
    toast(r.denied ? m().locDenied : m().locFail);
    return false;
  }
  showPick(r.loc);
  return true;
}

/** One's own place or event, also while hidden, normalised like public data. */
export async function loadOwn<T extends Place | EventSeries>(
  kind: 'place' | 'event',
  id: number,
): Promise<T | null> {
  const { myOwn } = await import('../api/rpc');
  const item = await myOwn<T>(kind, id);
  if (!item || kind === 'place') return item;
  const e = item as EventSeries;
  return { ...e, start_time: e.start_time.slice(0, 5), end_time: e.end_time.slice(0, 5) } as T;
}
