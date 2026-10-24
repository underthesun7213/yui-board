import { readAll, readVersion, type Snapshot } from '../api/rest';
import { loadSnapshot, saveSnapshot } from '../platform/idb';
import { isOnline, onConnectivity, onVisible } from '../platform/online';
import { data, setData } from '../state/data';
import { net } from '../state/net';
import { route } from '../state/route';

interface Stored extends Snapshot {
  version: number | null;
  fetchedAt: string;
}

let inFlight: Promise<void> | null = null;

/* Read everything again. With `ifChanged`, first ask the version number and
   skip the read when nothing changed (RFC-0003 §11.3). */
export function loadData(opts: { ifChanged?: boolean; fresh?: boolean } = {}): Promise<void> {
  /* after a write, a read already under way may predate it: wait, then read again */
  if (opts.fresh && inFlight) return inFlight.then(() => loadData());
  inFlight ??= (async () => {
    const before = data.get();
    if (!before.places.length && !before.events.length) data.set({ status: 'loading' });
    try {
      const version = await readVersion();
      if (opts.ifChanged && before.status === 'ok' && before.version === version) return;
      const s = await readAll();
      const fetchedAt = new Date().toISOString();
      setData(s.places, s.events, s.overrides, fetchedAt, version);
      void saveSnapshot({ ...s, version, fetchedAt } satisfies Stored);
    } catch {
      /* keep what is on screen; say whether it is the network */
      const offline = !isOnline();
      net.set({ online: !offline });
      data.set({ status: offline ? 'offline' : 'error' });
    }
  })().finally(() => {
    inFlight = null;
  });
  return inFlight;
}

const POLL_MS = 30_000;
let timer: ReturnType<typeof setInterval> | undefined;
const watching = () => ['map', 'cal', 'event'].includes(route.get().route.name);

/* Boot: draw the saved snapshot at once, then check the server. While the
   map or calendar is open, check every 30 s; also when the app comes back
   into view or online. */
export async function startData() {
  const saved = await loadSnapshot<Stored>();
  if (saved && data.get().status !== 'ok') {
    setData(
      saved.places,
      saved.events,
      saved.overrides,
      saved.fetchedAt,
      saved.version,
      isOnline() ? 'loading' : 'offline',
    );
  }
  net.set({ online: isOnline() });
  await loadData();
  const tick = () => {
    if (watching() && document.visibilityState === 'visible') void loadData({ ifChanged: true });
  };
  timer ??= setInterval(tick, POLL_MS);
  onVisible(() => void loadData({ ifChanged: true }));
  onConnectivity(() => {
    net.set({ online: isOnline() });
    if (isOnline()) void loadData({ ifChanged: true });
  });
  route.subscribe((s, prev) => {
    if (s.route.name !== prev.route.name && watching()) void loadData({ ifChanged: true });
  });
}
